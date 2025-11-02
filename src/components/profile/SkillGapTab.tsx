"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { SecondaryButton } from "@/components/ui/buttons/SecondaryButton";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "motion/react";
import { useOutsideClick } from "@/hooks/use-outside-click";
import {
	useGetSavedJobsQuery,
	useGetGapByJobQuery,
	useDeleteGapByJobMutation,
	gapApi,
	useAppSelector,
} from "@/store";
import type { GapGetByJobResponse, Job } from "@/schemas/api";
import { revalidateSavedJobs } from "@/app/actions/skill-gaps";
import { Badge } from "@/components/ui/badge";
// import Spinner from "react-bootstrap/Spinner";
import { Spinner } from "@/components/ui/spinner";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import { BookmarkIcon, Trash2 } from "lucide-react";
import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogCancel,
	AlertDialogAction,
} from "@/components/ui/alert-dialog";
import Link from "next/link";
import DOMPurify from "dompurify";
import { marked } from "marked";
import {
	Empty,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
	EmptyDescription,
	EmptyContent,
} from "@/components/ui/empty";

type SkillMatchMetadata = {
	name?: string;
	skill_id?: string | number;
	description?: string;
	short_description?: string;
	external_id?: string;
	category?: string;
	framework?: string;
	aliases?: string;
	version?: string;
};

type SkillMatch = {
	name?: string;
	skill_id?: string | number;
	metadata?: SkillMatchMetadata;
};

type SkillObject = {
	name?: string;
	title?: string;
	token?: string;
	query?: string;
	skill_name?: string;
	level_delta?: number;
	match?: SkillMatch;
	[token: string]: unknown;
};

type SkillEntry = string | SkillObject | undefined | null;

// create a function that returns the empty component
const EmptyComponent = () => {
	return (
		<Empty className="border-0 bg-transparent py-12">
			<EmptyHeader>
				<EmptyMedia variant="icon" className="bg-neutral-100">
					<BookmarkIcon className="h-6 w-6" />
				</EmptyMedia>
				<EmptyTitle>No gap reports yet</EmptyTitle>
				<EmptyDescription>
					Your skill gap reports appear once you save roles to your collection.
					<br />
					Tap the save&nbsp;
					<span className="inline-flex items-center text-muted-foreground">
						(<BookmarkIcon className="h-4 w-4" />)
					</span>
					&nbsp;button on a job listing to generate a comparison.
				</EmptyDescription>
			</EmptyHeader>
			<EmptyContent>
				<Button asChild variant="outline" size="sm">
					<Link href="/">Browse Jobs</Link>
				</Button>
			</EmptyContent>
		</Empty>
	);
};


function isSkillObject(skill: SkillEntry): skill is SkillObject {
	return typeof skill === "object" && skill !== null;
}

function getSkillLabel(skill: SkillEntry): string {
	if (!skill) return "Unknown skill";
	if (typeof skill === "string") {
		return skill.trim() || "Unknown skill";
	}
	if (isSkillObject(skill)) {
		return (
			skill.name ||
			skill.title ||
			skill.token ||
			skill.query ||
			skill.skill_name ||
			skill?.match?.name ||
			skill?.match?.metadata?.name ||
			"Unknown skill"
		);
	}
	return "Unknown skill";
}

function HoverInfo({
	label,
	children,
}: {
	label: string | number | undefined;
	children: React.ReactNode;
}) {
	const [open, setOpen] = useState(false);
	const triggerRef = useRef<HTMLDivElement | null>(null);
	const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

	useEffect(() => {
		if (!open) return;
		const updatePosition = () => {
			if (!triggerRef.current) return;
			const rect = triggerRef.current.getBoundingClientRect();
			setCoords({
				top: rect.bottom + window.scrollY + 8,
				left: rect.left + window.scrollX + rect.width / 2,
			});
		};
		updatePosition();
		window.addEventListener("scroll", updatePosition, true);
		window.addEventListener("resize", updatePosition);
		return () => {
			window.removeEventListener("scroll", updatePosition, true);
			window.removeEventListener("resize", updatePosition);
		};
	}, [open]);

	if (!label) {
		return <>{children}</>;
	}

	const tooltip =
		open && typeof document !== "undefined"
			? createPortal(
					<div
						className="pointer-events-none fixed z-50 whitespace-nowrap rounded-md border border-neutral-200 bg-white px-2 py-1 text-[11px] text-neutral-700 shadow-lg dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
						style={{ top: coords.top, left: coords.left, transform: "translateX(-50%)" }}
					>
						O*NET ID: {label}
					</div>,
					document.body
				)
			: null;

	return (
		<div
			ref={triggerRef}
			className="inline-block"
			onMouseEnter={() => setOpen(true)}
			onMouseLeave={() => setOpen(false)}
			onFocus={() => setOpen(true)}
			onBlur={() => setOpen(false)}
		>
			{children}
			{tooltip}
		</div>
	);
}

function SkillListSection({
	title,
	items,
	emptyText,
	badgeVariant,
}: {
	title: string;
	items: SkillEntry[];
	emptyText: string;
	badgeVariant?: "default" | "secondary" | "destructive" | "outline";
}) {
	return (
		<section className="space-y-2">
			<h4 className="text-sm font-semibold text-brand-primary font-sans">{title}</h4>
			{items.length > 0 ? (
				<div className="flex flex-wrap gap-2 text-brand-secondary font-sans text-sm">
					{items.map((skill, idx) => {
						const label = getSkillLabel(skill);
						const skillObj = isSkillObject(skill) ? skill : undefined;
						const delta = typeof skillObj?.level_delta === "number" ? skillObj.level_delta : undefined;
						const levelTag = typeof delta === "number" && delta > 0 ? ` (−${delta.toFixed(1)} lvl)` : "";
						const match = skillObj?.match;
						const metadata = match?.metadata;
						const onetName = match?.name || metadata?.name;
						const onetId = (metadata?.external_id || match?.skill_id || metadata?.skill_id || "").toString();
						const metaParts: string[] = [];
						if (metadata?.category) metaParts.push(metadata.category);
						if (metadata?.framework) metaParts.push(metadata.framework);
						if (metadata?.aliases) metaParts.push(`Aliases: ${metadata.aliases}`);
						if (metadata?.version) metaParts.push(`Version ${metadata.version}`);
						const description = metadata?.description || metadata?.short_description;
						return (
							<div key={`${label}-${idx}`} className="flex max-w-xs flex-col gap-1 text-xs text-brand-secondary font-sans">
								<HoverInfo label={onetId}>
									<Badge
										variant={badgeVariant === "destructive" ? "destructive" : "outline"}
										className="whitespace-normal break-words px-3 py-1 text-left text-xs font-semibold text-brand-primary"
									>
										{label}
										{levelTag}
									</Badge>
								</HoverInfo>
								{onetName ? (
									<p className="pl-1 text-[11px] text-brand-secondary">
										O*NET: {onetName}
									</p>
								) : null}
								{description ? (
									<p className="pl-1 text-[11px] text-brand-secondary/80">
										{description}
									</p>
								) : null}
								{metaParts.length > 0 ? (
									<p className="pl-1 text-[10px] uppercase tracking-wide text-brand-secondary/70">
										{metaParts.join(" · ")}
									</p>
								) : null}
							</div>
						);
					})}
				</div>
			) : (
				<p className="text-xs text-neutral-500">{emptyText}</p>
			)}
		</section>
	);
}
function GapDetailOverlay({
	gap,
	loading,
	onClose,
	job,
}: {
	gap: GapGetByJobResponse | null;
	loading?: boolean;
	onClose: () => void;
	job: Job | null;
}) {
	const ref = useRef<HTMLDivElement | null>(null);
	const id = useId();
	useOutsideClick(ref, (event) => {
		// If click is inside any popover or hovercard portal, ignore it
		const portals = document.querySelectorAll('[data-radix-popper-content-wrapper]');
		if (event) {
			for (const portal of portals) {
				if (portal.contains(event.target as Node)) return;
			}
		}
		onClose();
	});

	const matched = gap?.matched_skills || [];
	const missing = gap?.missing_skills || [];
	const weak = gap?.weak_skills || [];
	const resumeSkills = gap?.resume_skills || [];
	const reportHtml = useMemo(() => {
		if (!gap?.report_md) {
			return null;
		}
		const html = marked.parse(gap.report_md, { async: false }) as string;
		return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
	}, [gap?.report_md]);

	return (
		<AnimatePresence>
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4"
			>
				<motion.div
					layoutId={`gap-card-${job?.id ?? "unknown"}-${id}`}
					ref={ref}
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: 20 }}
					className="flex h-[70vh] w-full max-w-3xl flex-col rounded-3xl bg-white shadow-2xl dark:bg-white"
				>
				<header className="flex shrink-0 items-start justify-between gap-4 border-b border-neutral-200/80 px-6 py-4">
						<div className="flex-1 space-y-2 font-sans">
							<div>
								<h3 className="text-lg font-semibold text-brand-primary">
									{job?.title ?? "Job"}
								</h3>
								{job?.company ? (
									<p className="text-sm font-medium text-brand-primary/90">{job.company}</p>
								) : null}
							</div>
							<div className="flex flex-wrap gap-2 text-xs font-medium text-brand-secondary">
								<span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-brand-primary">
									Overall match {Math.round(((gap?.score || 0) * 10))}%
								</span>
								<span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-800">
									Matched {matched.length}
								</span>
								<span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-800">
									Weak {weak.length}
								</span>
								<span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-rose-800">
									Missing {missing.length}
								</span>
							</div>
							{job?.description ? (
								<p className="max-h-24 overflow-hidden text-sm text-brand-primary/80">
									{job.description}
								</p>
							) : null}
							{job?.external_url ? (
								<a
									href={job.external_url}
									target="_blank"
									rel="noreferrer"
									className="inline-flex items-center text-xs font-medium text-brand-primary hover:underline"
								>
									View original posting
								</a>
							) : null}
						</div>
						<div className="flex items-center gap-2">
							<HoverCard>
								<HoverCardTrigger asChild>
									<button
										type="button"
										className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
										aria-label="About skill gap report data"
									>
										<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
											<circle cx="12" cy="12" r="10"></circle>
											<line x1="12" y1="16" x2="12" y2="12"></line>
											<line x1="12" y1="8" x2="12" y2="8"></line>
										</svg>
									</button>
								</HoverCardTrigger>
								<HoverCardContent align="end" sideOffset={8} className="w-80">
									<p className="text-sm text-brand-primary">
										The skills are referencing the O*NET database — a comprehensive, open-source database of occupational information maintained by the U.S. Department of Labor&apos;s Employment and Training Administration (ETA).
									</p>
									<p className="mt-2 text-xs text-brand-secondary">
										See more details at
										{' '}
										<a href="https://www.onetonline.org" target="_blank" rel="noreferrer" className="underline">O*NET OnLine</a>.
									</p>
								</HoverCardContent>
							</HoverCard>
							<SecondaryButton onClick={onClose} className="px-3 py-1 text-xs sm:text-sm">
								Close
							</SecondaryButton>
						</div>
					</header>
					<div className="flex-1 overflow-y-auto px-6 py-5">
						{loading || !gap ? (
							<div className="flex items-center gap-2 py-6">
								<Spinner />
								<span>Loading report…</span>
							</div>
						) : (
							<div className="space-y-6">
							<SkillListSection
								title="Matched skills"
								items={matched}
								emptyText="No overlapping skills detected yet."
								badgeVariant="secondary"
							/>
							<SkillListSection
								title="Weak / optional skills"
								items={weak}
								emptyText="No optional or weak skills captured."
								badgeVariant="outline"
							/>
						<SkillListSection
							title="Missing skills"
							items={missing}
							emptyText="All required skills are currently covered."
							badgeVariant="destructive"
						/>
						<SkillListSection
							title="Skills Detected in Your Profile"
							items={resumeSkills}
							emptyText="No skills detected in your profile yet."
							badgeVariant="default"
						/>
							{reportHtml ? (
								<section className="space-y-2">
									<h4 className="text-sm font-semibold text-brand-primary font-sans">Detailed analysis</h4>
									<div
										className="gap-report-markdown font-sans text-sm leading-6 text-brand-primary/90 [&_p]:mt-2 [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:mt-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mt-1 [&_strong]:font-semibold [&_em]:italic [&_h3]:mt-4 [&_h3]:text-sm [&_h3]:font-semibold [&_h4]:mt-3 [&_h4]:text-sm [&_h4]:font-semibold"
										dangerouslySetInnerHTML={{ __html: reportHtml }}
									/>
								</section>
							) : null}
							</div>
						)}
					</div>
				</motion.div>
			</motion.div>
		</AnimatePresence>
	);
}

export default function SkillGapTab() {
	const { data, isLoading, isError, refetch } = useGetSavedJobsQuery(undefined, {
		refetchOnFocus: true,
		refetchOnReconnect: true,
	});
	const jobs = useMemo(() => data?.jobs ?? [], [data?.jobs]);
	const displayJobs = useMemo(
		() =>
			jobs.filter(
				(job) => job?.gap_state === "ready" || job?.gap_state === "generating"
			),
		[jobs]
	);
	const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
	const [expanded, setExpanded] = useState(false);
	const [deleteGapByJob, { isLoading: isDeletingGap }] = useDeleteGapByJobMutation();
	const [pendingDeleteJobId, setPendingDeleteJobId] = useState<number | null>(null);
	const [deleteError, setDeleteError] = useState<string | null>(null);

	// Determine if any job has a pending gap report
	const hasPending = useMemo(
		() => displayJobs.some((job) => job.gap_state === "generating"),
		[displayJobs]
	);

	// Get gap data for ready jobs (for rendering)
	const jobGaps = useAppSelector((state) => {
		const gaps: Record<number, GapGetByJobResponse | undefined> = {};
		displayJobs.forEach((job) => {
			if (job.gap_state !== "ready") {
				return;
			}
			const queryState = gapApi.endpoints.getGapByJob.select(job.id)(state);
			gaps[job.id] = queryState?.data;
		});
		return gaps;
	});

	// Manual polling when there are generating reports
	useEffect(() => {
		if (!hasPending) return;
		const id = setInterval(() => { refetch(); }, 5000);
		return () => clearInterval(id);
	}, [hasPending, refetch]);

	// Auto-select first visible job if none selected
	useEffect(() => {
		if (displayJobs.length === 0) {
			if (selectedJobId !== null) {
				setSelectedJobId(null);
			}
			return;
		}

		if (selectedJobId !== null && displayJobs.some((job) => job.id === selectedJobId)) {
			return;
		}

		setSelectedJobId(displayJobs[0]?.id ?? null);
	}, [displayJobs, selectedJobId]);

	const activeJob = useMemo(
		() => displayJobs.find((job) => job.id === selectedJobId) ?? null,
		[displayJobs, selectedJobId]
	);
	const shouldFetchActiveGap = !!activeJob && activeJob.gap_state === "ready";
	const { data: gap, isLoading: gapLoading } = useGetGapByJobQuery(activeJob?.id as number, {
		skip: !shouldFetchActiveGap,
		// Don't refetch if we have cached data (cache lasts 1 hour)
		refetchOnMountOrArgChange: false,
		refetchOnFocus: false,
	});

	const pendingDeleteJob = useMemo(
		() => jobs.find((job) => job.id === pendingDeleteJobId) ?? null,
		[jobs, pendingDeleteJobId]
	);

const handleDeleteDialogChange = (open: boolean) => {
	if (!open && !isDeletingGap) {
		setPendingDeleteJobId(null);
		setDeleteError(null);
	}
};

const handleConfirmDelete = async () => {
	if (!pendingDeleteJobId) {
		return;
	}
	setDeleteError(null);
	try {
		await deleteGapByJob(pendingDeleteJobId).unwrap();
		// Revalidate server-side views
		await revalidateSavedJobs();
		// RTK Query invalidates automatically, but refetch to ensure freshness
		refetch();
		// Close dialog and reset selection if needed
		if (selectedJobId === pendingDeleteJobId) {
			const nextJob = displayJobs.find((job) => job.id !== pendingDeleteJobId);
			setSelectedJobId(nextJob ? nextJob.id : null);
			setExpanded(false);
		}
		setPendingDeleteJobId(null);
	} catch (error) {
		console.error("Failed to remove skill gap report", error);
		setDeleteError("Failed to remove the skill gap report. Please try again.");
	}
};

	const gapData = gap && gap.exists ? gap : null;
	const showActiveGapLoading = shouldFetchActiveGap && gapLoading;

	if (isLoading) {
		return (
			<div className="flex items-center gap-2 py-6">
				<Spinner />
				<span>Loading saved jobs…</span>
			</div>
		);
	}
	if (isError) {
		return <div className="text-red-600">Failed to load saved jobs.</div>;
	}
	if (displayJobs.length === 0) {
		return (
			<EmptyComponent />
		);
	}

	return (
		<div className="grid grid-cols-1 gap-4">
			{selectedJobId !== null && showActiveGapLoading ? (
				<div className="flex items-center gap-2 py-6">
					<Spinner />
					<span>Loading report…</span>
				</div>
			) : null}
			{displayJobs.length ? (
				displayJobs.map((job) => {
					const isActive = job.id === selectedJobId;
					const isReady = job.gap_state === "ready";
					const isGenerating = job.gap_state === "generating";
					const jobGap = isReady ? jobGaps[job.id] : undefined;
					const hasGap = isReady && jobGap?.exists === true;
					const score = hasGap ? Math.round(((jobGap?.score ?? 0) * 10)) : 0;
					const matchedCount = hasGap ? jobGap?.matched_skills?.length || 0 : 0;
					const weakCount = hasGap ? jobGap?.weak_skills?.length || 0 : 0;
					const missingCount = hasGap ? jobGap?.missing_skills?.length || 0 : 0;
					const showCardSpinner = isGenerating || !hasGap;
					const isDeletingThisJob = isDeletingGap && pendingDeleteJobId === job.id;
					const cardDisabled = isDeletingThisJob;
					const baseCardClasses =
						"flex w-full flex-col gap-3 rounded-xl border px-5 py-6 text-left shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary sm:px-6 sm:py-7";
					const stateClasses =
						isActive && !cardDisabled
							? "border-primary/60 bg-primary/10 hover:border-primary"
							: "border-neutral-200/80 bg-white hover:border-primary/40";
					const interactionClasses = cardDisabled
						? "cursor-not-allowed opacity-60 hover:border-neutral-200/80 focus-visible:ring-0"
						: "cursor-pointer";
					const cardClassName = `${baseCardClasses} ${stateClasses} ${interactionClasses}`;

					const handleCardClick = () => {
						if (cardDisabled) {
							return;
						}
						setSelectedJobId(job.id);
						setExpanded(true);
					};

					const handleCardKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
						if (cardDisabled) {
							return;
						}
						if (event.key === "Enter" || event.key === " " || event.key === "Spacebar") {
							event.preventDefault();
							handleCardClick();
						}
					};

					return (
						<div
							key={job.id}
							role="button"
							tabIndex={cardDisabled ? -1 : 0}
							aria-disabled={cardDisabled}
							onClick={handleCardClick}
							onKeyDown={handleCardKeyDown}
							className={cardClassName}
						>
							<div className="flex items-start justify-between gap-4 font-sans">
								<div className="flex-1 space-y-1">
									<p className="text-base font-semibold text-brand-primary">{job.title}</p>
									{job.company ? (
										<p className="text-sm font-medium text-brand-primary/90">{job.company}</p>
									) : null}
								</div>
								<div className="flex items-start gap-2">
									<div className="flex shrink-0 flex-col items-end">
										<span className="text-xs uppercase tracking-wide text-brand-primary/80">Overall match</span>
									{!showCardSpinner ? (
											<span className="my-2 text-3xl font-semibold text-brand-primary">{score}%</span>
										) : (
											<Spinner className="my-2 size-8" />
										)}
									<span className={`text-xs font-medium ${hasGap ? "text-brand-primary/80" : "text-brand-secondary/60"}`}>
										{isDeletingThisJob
											? "Removing report…"
											: isGenerating
											?
												"Generating report…"
											: hasGap
											?
												"Click to expand"
											:
												"Loading report details…"}
										</span>
									</div>
								{isReady ? (
										<Button
											type="button"
											variant="ghost"
											size="icon"
											className="h-8 w-8 text-neutral-500 hover:bg-red-50 hover:text-red-600"
											onClick={(event) => {
												event.stopPropagation();
												event.preventDefault();
												if (isDeletingGap) {
													return;
												}
												setDeleteError(null);
												setPendingDeleteJobId(job.id);
											}}
											disabled={isDeletingGap}
											aria-label="Remove skill gap report"
										>
											{isDeletingThisJob ? <Spinner className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
											<span className="sr-only">Remove skill gap report</span>
										</Button>
								) : null}
								</div>
							</div>
							<div className="flex flex-wrap gap-2 text-xs font-medium text-brand-secondary">
							{hasGap ? (
									<>
										<span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-800">
											Matched {matchedCount}
										</span>
										<span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-800">
											Weak {weakCount}
										</span>
										<span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-rose-800">
											Missing {missingCount}
										</span>
									</>
							) : (
									<span className="text-sm text-brand-secondary/70">
									{isGenerating
										? "We’re generating this report. This view refreshes automatically."
										: "Loading report details…"}
									</span>
								)}
							</div>
						</div>
					);
				})
			) : (
				<EmptyComponent />
			)}
			{expanded ? (
				<GapDetailOverlay gap={gapData} loading={gapLoading} job={activeJob} onClose={() => setExpanded(false)} />
			) : null}
			<AlertDialog open={pendingDeleteJobId !== null} onOpenChange={handleDeleteDialogChange}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Remove skill gap report?</AlertDialogTitle>
						<AlertDialogDescription>
							{pendingDeleteJob ? (
								<span>
									This will remove the skill gap report for
									{' '}
									<span className="font-medium text-brand-primary">{pendingDeleteJob.title}</span>
									{pendingDeleteJob.company ? (
										<span>
											{' '}
											at {pendingDeleteJob.company}
										</span>
									) : null}
									. The job will stay in your saved collection.
								</span>
							) : (
								<span>This will remove the selected skill gap report. The job will stay in your saved collection.</span>
							)}
						</AlertDialogDescription>
						{deleteError ? <p className="text-sm text-red-600">{deleteError}</p> : null}
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isDeletingGap}>
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleConfirmDelete}
							disabled={isDeletingGap}
							className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
						>
							{isDeletingGap ? "Removing…" : "Remove report"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

