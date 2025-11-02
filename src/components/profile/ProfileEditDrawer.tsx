'use client'

import { useState, useEffect } from 'react';
import { UserContactInfo } from '@/types/api';
import { useUpdateContactInfoMutation } from '@/store';
import { 
  Drawer, 
  DrawerClose, 
  DrawerContent, 
  DrawerDescription, 
  DrawerFooter, 
  DrawerHeader, 
  DrawerTitle 
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PrimaryButton, CancelButton } from '@/components/ui/buttons';
import { toast } from 'sonner';

interface ProfileEditDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  contactInfo: UserContactInfo;
  onSave: (updatedInfo: UserContactInfo) => void;
}

export default function ProfileEditDrawer({ 
  isOpen, 
  onOpenChange, 
  contactInfo, 
  onSave 
}: ProfileEditDrawerProps) {
  const [editForm, setEditForm] = useState<UserContactInfo>(contactInfo);
  const [updateContactInfo, { isLoading: saving }] = useUpdateContactInfoMutation();
  const [phoneError, setPhoneError] = useState<string>('');
  const [emailError, setEmailError] = useState<string>('');

  // Email validation function
  const validateEmail = (email: string): string => {
    if (!email || email.trim() === '') {
      return 'Email is required';
    }
    
    // Basic email regex pattern
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address (e.g., user@example.com)';
    }
    
    // Additional checks
    if (email.length > 254) {
      return 'Email address is too long';
    }
    
    if (email.includes('..')) {
      return 'Email cannot contain consecutive dots';
    }
    
    if (email.startsWith('.') || email.endsWith('.')) {
      return 'Email cannot start or end with a dot';
    }
    
    return ''; // Valid
  };

  // Simple phone number validation
  const validatePhoneNumber = (phone: string): string => {
    if (!phone || phone.trim() === '') {
      return ''; // Empty is valid
    }
    
    // Remove all non-digit characters except + at the start
    const cleaned = phone.replace(/[^\d+]/g, '');
    
    // Must start with + and have at least 10 digits
    if (!cleaned.startsWith('+')) {
      return 'Phone number must start with country code (e.g., +1 for US)';
    }
    
    if (cleaned.length < 10) {
      return 'Phone number is too short';
    }
    
    if (cleaned.length > 15) {
      return 'Phone number is too long';
    }
    
    return ''; // Valid
  };

  // Update form when contactInfo changes
  useEffect(() => {
    setEditForm(contactInfo);
  }, [contactInfo]);

  const handleSaveProfile = async () => {
    // Validate email before submitting
    const emailValidationError = validateEmail(editForm.email);
    if (emailValidationError) {
      setEmailError(emailValidationError);
      toast.error(emailValidationError);
      return;
    }
    
    // Validate phone number before submitting
    const phoneValidationError = validatePhoneNumber(editForm.phone_number);
    if (phoneValidationError) {
      setPhoneError(phoneValidationError);
      toast.error(phoneValidationError);
      return;
    }
    
    setEmailError(''); // Clear any previous errors
    setPhoneError(''); // Clear any previous errors
    
    try {
      const result = await updateContactInfo(editForm).unwrap();
      onSave(result);
      onOpenChange(false);
      toast.success('Profile updated successfully!');
    } catch (e: unknown) {
      console.error('Error saving profile:', e);
      
      // Extract specific error message from the API response
      let errorMessage = 'Failed to save profile. Please try again.';
      
      // Type guard for RTK Query error
      if (e && typeof e === 'object' && 'data' in e) {
        const errorData = e.data as { error?: string; details?: string; field?: string };
        if (errorData?.error) {
          errorMessage = errorData.error;
          
          // Add field-specific error details
          if (errorData.details) {
            errorMessage += `: ${errorData.details}`;
          }
          
          // Add field-specific guidance
          if (errorData.field === 'phone_number') {
            errorMessage += '\n\nPlease use international format (e.g., +1234567890) or leave empty.';
          } else if (errorData.field === 'email') {
            errorMessage += '\n\nPlease enter a valid email address (e.g., user@example.com).';
          }
        }
      } else if (e && typeof e === 'object' && 'message' in e) {
        errorMessage = (e as Error).message;
      }
      
      toast.error(errorMessage);
    }
  };

  const handleCancel = () => {
    setEditForm(contactInfo); // Reset form to original values
    onOpenChange(false);
  };

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange} direction="right">
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="font-sans">Edit Profile</DrawerTitle>
          <DrawerDescription className="font-sans">
            Update your contact information below.
          </DrawerDescription>
        </DrawerHeader>

        <div className="p-4 space-y-4 overflow-y-auto">
          <div className="space-y-2">
            <Label htmlFor="name" className="font-sans">Name</Label>
            <Input
              id="name"
              value={editForm.name || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                setEditForm({ ...editForm, name: e.target.value })
              }
              placeholder="Enter your name"
              className="font-sans"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="font-sans">Email</Label>
            <Input
              id="email"
              type="email"
              value={editForm.email || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const value = e.target.value;
                setEditForm({ ...editForm, email: value });
                
                // Real-time validation
                const error = validateEmail(value);
                setEmailError(error);
              }}
              placeholder="Enter your email"
              className={`font-sans ${emailError ? 'border-red-500' : ''}`}
            />
            {emailError ? (
              <p className="text-sm text-red-500 font-sans">
                {emailError}
              </p>
            ) : (
              <p className="text-sm text-gray-500 font-sans">
                Enter a valid email address
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="font-sans">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={editForm.phone_number || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const value = e.target.value;
                setEditForm({ ...editForm, phone_number: value });
                
                // Real-time validation
                const error = validatePhoneNumber(value);
                setPhoneError(error);
              }}
              placeholder="Enter your phone number (e.g., +1 555 123 4567)"
              className={`font-sans ${phoneError ? 'border-red-500' : ''}`}
            />
            {phoneError ? (
              <p className="text-sm text-red-500 font-sans">
                {phoneError}
              </p>
            ) : (
              <p className="text-sm text-gray-500 font-sans">
                Enter your phone number in international format (e.g., +1 555 123 4567) or leave empty
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="location" className="font-sans">Location</Label>
            <Input
              id="location"
              value={editForm.location || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                setEditForm({ ...editForm, location: e.target.value })
              }
              placeholder="Enter your location"
              className="font-sans"
            />
          </div>
        </div>

        <DrawerFooter>
          <PrimaryButton 
            onClick={handleSaveProfile} 
            disabled={saving || !!phoneError || !!emailError}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </PrimaryButton>
          <DrawerClose asChild>
            <CancelButton onClick={handleCancel}>
              Cancel
            </CancelButton>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
