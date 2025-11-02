import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { MailIcon, PhoneIcon, MapPinIcon, UserIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

import { UserContactInfo } from "@/types/api";
import { SecondaryButton } from "../ui/buttons";

export const ProfileCardWrapper = ({ children }: { children: React.ReactNode }) => (
    <Card className="h-full w-full max-w-xl p-4 sm:p-6 my-2 sm:my-6 min-h-[40vh] flex flex-col">{children}</Card>
);

export const ProfileCardHeaderWrapper = ({ children }: { children: React.ReactNode }) => (
  <CardHeader className="flex-shrink-0">{children}</CardHeader>
);

export const ProfileCardContentWrapper = ({ children }: { children: React.ReactNode }) => (
  <CardContent className="space-y-1 flex flex-col gap-6 flex-1 justify-between">{children}</CardContent>
);

export const ProfileInfoText = ({ children }: { children: React.ReactNode }) => (
  <p className="text-base sm:text-lg text-brand-primary font-sans">{children}</p>
);

interface ProfileCardProps {
  contactInfo: UserContactInfo;
  onEditProfile?: () => void;
  loading?: boolean;
}

export default function ProfileCard({ contactInfo, onEditProfile, loading }: ProfileCardProps) {
  const { name, email, phone_number, location } = contactInfo;

  return (
    <ProfileCardWrapper>
      <ProfileCardHeaderWrapper>
        {loading ? (
          <Skeleton className="h-8 w-40" />
        ) : (
          <CardTitle className="text-2xl sm:text-3xl text-brand-primary font-bold font-sans">Profile</CardTitle>
        )}
      </ProfileCardHeaderWrapper>
      <ProfileCardContentWrapper>
        {loading ? (
          <div className="space-y-3 sm:space-y-4">
            <Skeleton className="h-6 w-56 m-2" />
            <Skeleton className="h-6 w-56 m-2" />
            <Skeleton className="h-6 w-56 m-2" />
            <Skeleton className="h-6 w-56 m-2" />
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            <ProfileInfoText><UserIcon className="w-5 h-5 sm:w-6 sm:h-6 inline-block mr-3 sm:mr-4 text-brand-secondary font-bold font-sans" /> {name || 'Not set'}</ProfileInfoText>
            <ProfileInfoText><MailIcon className="w-5 h-5 sm:w-6 sm:h-6 inline-block mr-3 sm:mr-4 text-brand-secondary font-bold font-sans" /> {email || 'Not set'}</ProfileInfoText>
            <ProfileInfoText><PhoneIcon className="w-5 h-5 sm:w-6 sm:h-6 inline-block mr-3 sm:mr-4 text-brand-secondary font-bold font-sans" /> {phone_number || 'Not set'}</ProfileInfoText>
            <ProfileInfoText><MapPinIcon className="w-5 h-5 sm:w-6 sm:h-6 inline-block mr-3 sm:mr-4 text-brand-secondary font-bold font-sans" /> {location || 'Not set'}</ProfileInfoText>
          </div>
        )}
        {loading ? (
          <Skeleton className="h-10 w-full" />
        ) : onEditProfile && (
          <SecondaryButton onClick={onEditProfile}>
            Edit Profile
          </SecondaryButton>
        )}
      </ProfileCardContentWrapper>
    </ProfileCardWrapper>
  )
}