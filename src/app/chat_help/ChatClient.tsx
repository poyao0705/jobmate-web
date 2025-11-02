"use client";

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
} from "react";
import { Button } from "@/components/ui/button";
import DOMPurify from "dompurify";
import { marked } from "marked";
import {
  useGetChatsQuery,
  useGetChatMessagesQuery,
  useCreateChatMutation,
  useDeleteChatMutation,
} from "@/store";
import ContextLoadedNotification from "@/components/ui/ContextLoadedNotification";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

interface ChatItem {
  id: number;
  title: string;
  timestamp?: string;
  model: string;
}

export default function ChatClient() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [model, setModel] = useState("deepseek-chat");
  const [sending, setSending] = useState(false);
  const chatBoxRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const computed = window.getComputedStyle(el);
    const lineHeight = parseFloat(computed.lineHeight) || 22;
    const paddingTop = parseFloat(computed.paddingTop) || 0;
    const paddingBottom = parseFloat(computed.paddingBottom) || 0;
    const maxHeight = lineHeight * 10 + paddingTop + paddingBottom;
    const newHeight = Math.min(el.scrollHeight, maxHeight);
    el.style.height = `${newHeight}px`;
    el.style.overflowY = el.scrollHeight > maxHeight ? "auto" : "hidden";
  }, []);

  const scrollToBottom = useCallback(() => {
    const el = chatBoxRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, []);

  const [currentChatId, setCurrentChatId] = useState<number | null>(null);
  const [contextInfo, setContextInfo] = useState<any>(null);
  const [showContextNotification, setShowContextNotification] = useState(false);
  // removed sidebarCollapsed state and its toggle functionality

  // Use RTK Query for chats
  const {
    data: chatsData,
    error: chatsError,
    isLoading: chatsLoading,
  } = useGetChatsQuery();
  const chats = useMemo(() => {
    console.log("[ChatClient] chatsData:", chatsData);
    console.log("[ChatClient] chatsError:", chatsError);
    console.log("[ChatClient] chatsLoading:", chatsLoading);
    return chatsData?.chats || [];
  }, [chatsData, chatsError, chatsLoading]);

  // Use RTK Query for messages
  const { data: messagesData, error: messagesError } = useGetChatMessagesQuery(
    currentChatId!,
    {
      skip: !currentChatId,
    }
  );
  const [createChat] = useCreateChatMutation();
  const [deleteChat] = useDeleteChatMutation();

  // Set current chat when chats load or from URL parameter
  useEffect(() => {
    console.log(
      "[ChatClient] useEffect - chats:",
      chats.length,
      "currentChatId:",
      currentChatId
    );

    // Check if there's a chatId in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const chatIdFromUrl = urlParams.get("chatId");
    console.log("[ChatClient] chatIdFromUrl:", chatIdFromUrl);

    if (chatIdFromUrl) {
      const chatId = parseInt(chatIdFromUrl, 10);
      console.log("[ChatClient] Parsed chatId:", chatId);
      if (!isNaN(chatId) && chats.some((c) => c.id === chatId)) {
        console.log("[ChatClient] Setting currentChatId to:", chatId);
        setCurrentChatId(chatId);
        // Clean up the URL
        window.history.replaceState({}, "", "/chat_help");
        return;
      } else {
        console.log("[ChatClient] Chat not found in list or invalid ID");
      }
    }

    // Default: select first chat if none selected
    if (chats.length > 0 && !currentChatId) {
      const first = chats[0]?.id ?? null;
      console.log("[ChatClient] No current chat, selecting first:", first);
      setCurrentChatId(first);
    }
  }, [chats, currentChatId]);

  // Check for context info in sessionStorage when chat loads
  useEffect(() => {
    console.log(
      "[ChatClient] Checking for context, currentChatId:",
      currentChatId
    );
    if (currentChatId) {
      const key = `chat_context_${currentChatId}`;
      console.log("[ChatClient] Looking for sessionStorage key:", key);
      const storedContext = sessionStorage.getItem(key);
      console.log(
        "[ChatClient] storedContext:",
        storedContext ? "FOUND" : "NOT FOUND"
      );

      if (storedContext) {
        try {
          const parsed = JSON.parse(storedContext);
          console.log("[ChatClient] Parsed context:", parsed);
          setContextInfo(parsed);
          setShowContextNotification(true);

          // Auto-dismiss after 8 seconds
          setTimeout(() => {
            setShowContextNotification(false);
          }, 8000);

          // Clear from storage after showing
          sessionStorage.removeItem(key);
          console.log(
            "[ChatClient] Context notification shown and cleared from storage"
          );
        } catch (e) {
          console.error("Failed to parse context info:", e);
        }
      }
    }
  }, [currentChatId]);

  // Update messages when messagesData changes
  useEffect(() => {
    if (messagesData?.messages) {
      const msgs: Msg[] = (messagesData.messages || []).map(
        (m: { role: string; content?: string }) => ({
          role: m.role as "user" | "assistant",
          content: m.content || "",
        })
      );
      setMessages(msgs);
    }
  }, [messagesData]);

  // Handle messages loading errors
  useEffect(() => {
    if (messagesError && "status" in messagesError) {
      if (messagesError.status === 401 || messagesError.status === 403) {
        console.warn(
          `Access denied for chat ${currentChatId}. Refreshing chats.`
        );
        // RTK will automatically refetch chats due to cache invalidation
        return;
      }
      console.error(messagesError);
    }
  }, [messagesError, currentChatId]);

  const handleNewChat = useCallback(async () => {
    try {
      const result = await createChat({ model }).unwrap();
      const chat: ChatItem = result.chat;
      setCurrentChatId(chat.id);
      setMessages([]);
    } catch (e) {
      console.error(e);
    }
  }, [model, createChat]);

  const handleDeleteChat = useCallback(
    async (id: number) => {
      try {
        await deleteChat(id).unwrap();
        if (currentChatId === id) {
          const next = chats.filter((c) => c.id !== id)[0]?.id ?? null;
          setCurrentChatId(next);
          if (!next) setMessages([]);
        }
      } catch (e) {
        if (e && typeof e === "object" && "status" in e) {
          if (e.status === 401 || e.status === 403) {
            console.warn(
              `No permission to delete chat ${id}. Refreshing chats.`
            );
            return;
          }
        }
        console.error(e);
      }
    },
    [currentChatId, chats, deleteChat]
  );

  const handleSelectChat = useCallback(async (id: number) => {
    setCurrentChatId(id);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // 监听输入内容变化，保持自适应高度
  useEffect(() => {
    autoResize();
  }, [autoResize]);

  useEffect(() => {
    autoResize();
  }, [input, autoResize]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    // push user message
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    // RTK cache will handle chat updates automatically

    setInput("");
    setSending(true);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60000);

      const resp = await fetch("/api/backend/chat/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/plain, application/json",
        },
        body: JSON.stringify({ message: text, model, chat_id: currentChatId }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!resp.ok || !resp.body) {
        let detail = "";
        try {
          detail = await resp.text();
        } catch {}
        throw new Error(
          `Upstream error: ${resp.status}${detail ? ` - ${detail}` : ""}`
        );
      }

      // Sync current chat id from server in case a new chat was created
      const hdrChatId = resp.headers.get("x-chat-id");
      if (hdrChatId) {
        const newId = Number(hdrChatId);
        if (!Number.isNaN(newId) && newId !== currentChatId) {
          setCurrentChatId(newId);
        }
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";
      let received = false;
      let sseBuffer = ""; // Buffer for SSE parsing

      // pre-create assistant message container
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      const updateLastAssistant = (content: string) => {
        buffer = content;
        setMessages((prev) => {
          const next = [...prev];
          for (let i = next.length - 1; i >= 0; i--) {
            if (next[i].role === "assistant") {
              next[i] = { ...next[i], content: buffer };
              break;
            }
          }
          return next;
        });
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Decode the chunk and add to SSE buffer
        const chunk = decoder.decode(value, { stream: true });
        sseBuffer += chunk;

        // Process complete SSE messages (separated by double newlines)
        const lines = sseBuffer.split("\n");
        sseBuffer = lines.pop() || ""; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const content = line.substring(6); // Remove "data: " prefix
            received = true;
            buffer += content; // Accumulate content
            updateLastAssistant(buffer);
          }
        }
      }
      // If no content received, provide a helpful fallback message
      if (!received && buffer.length === 0) {
        updateLastAssistant(
          "⚠️ 没有收到模型输出，请稍后重试或检查配置（API Key/网络）。"
        );
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `⚠️ Error: ${(err as Error).message}` },
      ]);
    } finally {
      setSending(false);
    }
  };

  const renderMarkdown = (text: string) => {
    const html = marked.parse(text || "", { async: false }) as string;
    const clean = DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
    return { __html: clean };
  };

  return (
    <div className="h-full grid grid-cols-[260px_1fr]">
      {/* Context Loaded Notification */}
      {showContextNotification && contextInfo && (
        <ContextLoadedNotification
          context={contextInfo}
          onDismiss={() => setShowContextNotification(false)}
        />
      )}

      {/* Sidebar */}
      <div className="border-r">
        <div className="p-3 flex items-center justify-center gap-2">
          <Button
            onClick={handleNewChat}
            className="!bg-secondary-button-bg !text-secondary-button-text !border-secondary-button-border hover:!bg-secondary-button-hover-bg hover:!text-secondary-button-hover-text font-sans"
            variant="outline"
          >
            New Chat
          </Button>
        </div>
        <div className="overflow-y-auto">
          {chats.map((c) => (
            <div
              key={c.id}
              className={`px-3 py-2 border-b ${
                currentChatId === c.id ? "bg-surface" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 text-center">
                  <button
                    className="text-sm font-mono"
                    onClick={() => handleSelectChat(c.id)}
                  >
                    <strong>Chat #{c.id}</strong>
                    <div className="text-xs text-gray-500">
                      {c.timestamp?.slice(0, 10)}
                    </div>
                  </button>
                </div>
                <button
                  className="text-red-600 text-xs"
                  onClick={() => handleDeleteChat(c.id)}
                >
                  ✖
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main */}
      <div className="grid grid-rows-[auto_1fr_auto] h-full">
        <div className="flex items-center justify-between px-4 py-2 border-b">
          <div className="flex items-center gap-2">
            <h2 className="font-sans text-lg text-brand-primary">Chatbot</h2>
          </div>
          <div>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="deepseek-chat">DeepSeek V3</option>
              <option value="deepseek-reasoner">DeepSeek Reasoner</option>
              <option value="gpt-4o-mini">ChatGPT 4o-mini</option>
              <option value="gpt-4o">ChatGPT 4o</option>
              <option value="gpt-4.1-mini">ChatGPT 4.1-mini</option>
              <option value="gpt-4.1">ChatGPT 4.1</option>
              <option value="gpt-3.5-turbo">ChatGPT 3.5-turbo</option>
            </select>
          </div>
        </div>

        {/* Messages + Composer (composer moved inside to allow free upward expansion) */}
        {/* Messages container only (remove inner sticky composer and bottom padding) */}
        <div
          ref={chatBoxRef}
          className="bg-white rounded-lg min-h-0 overflow-y-auto"
        >
          <div className="p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-brand-secondary font-sans text-sm">
                Welcome to the Jobmate.agent!
              </div>
            ) : (
              messages.map((m, idx) => (
                <div
                  key={idx}
                  className={
                    m.role === "user"
                      ? "text-sm text-gray-800"
                      : "text-sm text-brand-primary"
                  }
                >
                  {m.role === "assistant" ? (
                    <div dangerouslySetInnerHTML={renderMarkdown(m.content)} />
                  ) : (
                    <div className="whitespace-pre-wrap">{m.content}</div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Composer */}
        {/* Bottom Composer (visible at the very bottom row) */}
        <form
          onSubmit={handleSubmit}
          className="w-full flex justify-center items-center gap-2 px-4 py-3 border-t bg-white"
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter your message..."
            rows={2}
            className="w-[640px] border rounded px-3 py-2 text-sm resize-none"
            onInput={autoResize}
          />
          <Button
            type="submit"
            disabled={sending}
            className="min-w-[80px] bg-primary-button-bg text-primary-button-text border-primary-button-border hover:bg-primary-button-hover-bg hover:text-primary-button-hover-text font-sans"
          >
            {sending ? "Sending..." : "Send"}
          </Button>
        </form>
      </div>
    </div>
  );
}
