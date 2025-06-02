
'use client';

import type { UserPreference } from '@/types';
import { useState, useRef, type ChangeEvent, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { UserCircle, Palette, UploadCloud, Trash2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { adminSetUserPreferenceAction } from '@/lib/actions';
import Image from 'next/image';

interface AdminUserPreferenceItemProps {
  nickname: string;
  initialPreference?: UserPreference;
  onPreferenceUpdated: (updatedPreference: UserPreference) => void;
}

const availableBadges = ["admin", "mod", "negro"] as const;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Saving...' : <><Save className="mr-2 h-4 w-4" /> Save Preferences</>}
    </Button>
  );
}

export default function AdminUserPreferenceItem({ nickname, initialPreference, onPreferenceUpdated }: AdminUserPreferenceItemProps) {
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  
  const [selectedBadges, setSelectedBadges] = useState<string[]>(initialPreference?.badges || []);
  const [backgroundGifPreview, setBackgroundGifPreview] = useState<string | null>(initialPreference?.backgroundGifUrl || null);
  const [backgroundGifFile, setBackgroundGifFile] = useState<File | null>(null);
  const gifInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSelectedBadges(initialPreference?.badges || []);
    setBackgroundGifPreview(initialPreference?.backgroundGifUrl || null);
    setBackgroundGifFile(null); // Reset file input on prop change
    if (gifInputRef.current) gifInputRef.current.value = "";
  }, [initialPreference, nickname]);


  const handleBadgeChange = (badge: string, checked: boolean) => {
    setSelectedBadges(prev => 
      checked ? [...prev, badge] : prev.filter(b => b !== badge)
    );
  };

  const handleGifFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'image/gif') {
        toast({ title: "Invalid File", description: "Please select a GIF file.", variant: "destructive" });
        setBackgroundGifFile(null);
        // Don't reset preview here, allow "remove" to do it or successful upload
        if (gifInputRef.current) gifInputRef.current.value = "";
        return;
      }
      setBackgroundGifFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBackgroundGifPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setBackgroundGifFile(null);
      // Don't reset preview if file is deselected, rely on "Remove" button or new upload
    }
  };

  const handleRemoveGif = () => {
    setBackgroundGifFile(null);
    setBackgroundGifPreview(null); 
    if (gifInputRef.current) gifInputRef.current.value = "";
    // The actual removal from server happens on form submit with removeBackgroundGif flag
  };

  const handleSubmit = async (formData: FormData) => {
    formData.append('nickname', nickname);
    selectedBadges.forEach(badge => formData.append('badges[]', badge));

    if (!backgroundGifFile && !backgroundGifPreview && initialPreference?.backgroundGifUrl) {
      // This case means user wants to remove the existing GIF without uploading a new one
      formData.append('removeBackgroundGif', 'true');
    } else if (backgroundGifFile) {
        // File is staged, it will be handled by the action
    } else if (!backgroundGifPreview && initialPreference?.backgroundGifUrl) {
        // User cleared preview of an existing GIF, means remove
        formData.append('removeBackgroundGif', 'true');
    }


    const result = await adminSetUserPreferenceAction(formData);

    if (result?.success && result.updatedPreference) {
      toast({ title: "Success", description: result.success });
      onPreferenceUpdated(result.updatedPreference);
      setBackgroundGifFile(null); // Clear staged file
      if (gifInputRef.current) gifInputRef.current.value = "";
      // Preview is already updated or cleared by client logic, or will be by effect
    } else if (result?.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
      // Revert preview if upload failed, to show original state
      setBackgroundGifPreview(initialPreference?.backgroundGifUrl || null);
    }
  };
  
  const getBadgeStyle = (badge: string) => {
    switch (badge.toLowerCase()) {
      case 'admin': return "bg-red-600 text-white";
      case 'mod': return "bg-blue-600 text-white";
      case 'negro': return "bg-black text-white";
      default: return "bg-gray-500 text-white";
    }
  };
  
  return (
    <Card className="shadow-md">
      <CardHeader>
        <div className="flex items-center gap-2">
          <UserCircle className="h-6 w-6 text-primary" />
          <CardTitle className="text-lg font-semibold">{nickname}</CardTitle>
        </div>
        <CardDescription>Manage badges and background GIF for this user.</CardDescription>
      </CardHeader>
      <form ref={formRef} action={handleSubmit}>
        <CardContent className="space-y-6">
          <div>
            <Label className="text-sm font-semibold mb-2 block">Badges</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {availableBadges.map(badge => (
                <div key={badge} className="flex items-center space-x-2 p-2 border rounded-md">
                  <Checkbox
                    id={`${nickname}-${badge}`}
                    checked={selectedBadges.includes(badge)}
                    onCheckedChange={(checked) => handleBadgeChange(badge, !!checked)}
                  />
                  <Label htmlFor={`${nickname}-${badge}`} className={`text-xs px-1.5 py-0.5 rounded-full ${getBadgeStyle(badge)}`}>
                    {badge.charAt(0).toUpperCase() + badge.slice(1)}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor={`gifFile-${nickname}`} className="text-sm font-semibold mb-1 block">
              Background GIF <span className="text-xs text-muted-foreground">(Overrides message-specific GIFs if any were set previously)</span>
            </Label>
            <div className="flex items-center gap-2">
              <Input 
                id={`gifFile-${nickname}`}
                name="backgroundGifFile"
                ref={gifInputRef}
                type="file" 
                accept="image/gif"
                onChange={handleGifFileChange}
                className="text-xs flex-1"
              />
            </div>
            {backgroundGifPreview && (
              <div className="mt-2 flex items-start gap-3 p-2 border rounded-md bg-secondary/20">
                <Image 
                    src={backgroundGifPreview} 
                    alt="GIF preview" 
                    width={100} height={60} 
                    className="rounded border object-cover" 
                    unoptimized={backgroundGifPreview.startsWith('blob:')} // for local blob previews
                    data-ai-hint="GIF preview" 
                />
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  className="text-destructive hover:text-destructive/80 h-8 mt-1"
                  onClick={handleRemoveGif}
                >
                  <Trash2 className="mr-1 h-4 w-4" /> Remove
                </Button>
              </div>
            )}
             {!backgroundGifPreview && initialPreference?.backgroundGifUrl && ( 
                // This case is when a GIF was previously set, but user cleared it via remove button (preview is null)
                // OR initial load with an existing GIF and no new file selected yet.
                 <div className="mt-2 flex items-start gap-3 p-2 border rounded-md bg-secondary/20">
                    <Image 
                        src={initialPreference.backgroundGifUrl} 
                        alt="Current GIF" 
                        width={100} height={60} 
                        className="rounded border object-cover" 
                        data-ai-hint="GIF current" 
                    />
                    <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        className="text-destructive hover:text-destructive/80 h-8 mt-1"
                        onClick={handleRemoveGif}
                    >
                        <Trash2 className="mr-1 h-4 w-4" /> Remove
                    </Button>
                </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end border-t pt-4">
          <SubmitButton />
        </CardFooter>
      </form>
    </Card>
  );
}
