'use client';

// PhotoIntakeButton — AI-powered photo-to-intake feature.
// Uploads a document image to /api/ai/photo-intake and returns extracted fields.
// All output is a DRAFT — caller must review before saving.

import { useRef, useState } from 'react';
import { Loader2, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { PhotoIntakeResult } from '@/types/database';

interface PhotoIntakeButtonProps {
  onFieldsExtracted: (fields: PhotoIntakeResult) => void;
}

type Status = 'idle' | 'loading' | 'success' | 'error';

export function PhotoIntakeButton({ onFieldsExtracted }: PhotoIntakeButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [extractedFields, setExtractedFields] =
    useState<PhotoIntakeResult | null>(null);

  function handleButtonClick() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset state
    setErrorMessage(null);
    setExtractedFields(null);

    // Preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setDialogOpen(true);
    setStatus('loading');

    try {
      // Convert to base64
      const base64 = await fileToBase64(file);
      const mimeType = file.type as
        | 'image/jpeg'
        | 'image/png'
        | 'image/gif'
        | 'image/webp';

      const response = await fetch('/api/ai/photo-intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, mimeType }),
      });

      const json: { data?: { fields: PhotoIntakeResult }; error?: string } =
        await response.json();

      if (!response.ok || json.error) {
        throw new Error(
          json.error ?? 'Could not read the form. Please enter fields manually.'
        );
      }

      setExtractedFields(json.data!.fields);
      setStatus('success');
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'An error occurred. Please enter fields manually.'
      );
      setStatus('error');
    } finally {
      // Reset file input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function handleUseFields() {
    if (extractedFields) {
      onFieldsExtracted(extractedFields);
    }
    handleClose();
  }

  function handleClose() {
    setDialogOpen(false);
    setStatus('idle');
    setErrorMessage(null);
    setExtractedFields(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  }

  return (
    <>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={handleFileChange}
        aria-label="Upload intake form image"
      />

      {/* Trigger button */}
      <Button
        type="button"
        variant="outline"
        onClick={handleButtonClick}
        className="border-amber-300 text-amber-700 hover:bg-amber-50 hover:border-amber-400 gap-2"
      >
        <Sparkles className="h-4 w-4" aria-hidden="true" />
        Photo-to-Intake
        <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs ml-1">
          AI
        </Badge>
      </Button>

      {/* Processing dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" aria-hidden="true" />
              Photo-to-Intake
              <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                AI Draft
              </Badge>
            </DialogTitle>
            <DialogDescription>
              Claude is reading your intake form and extracting fields. All
              results are drafts — you must review before saving.
            </DialogDescription>
          </DialogHeader>

          {/* Preview */}
          {previewUrl && (
            <div className="rounded-md overflow-hidden border bg-muted max-h-48 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Uploaded intake form"
                className="max-h-48 object-contain"
              />
            </div>
          )}

          {/* Loading state */}
          {status === 'loading' && (
            <div className="flex items-center gap-3 text-sm text-muted-foreground py-2">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Reading form with Claude Vision…
            </div>
          )}

          {/* Success state */}
          {status === 'success' && extractedFields && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Fields extracted. Review below before applying to the form.
              </p>
              <div className="rounded-md border bg-muted/50 p-3 text-sm space-y-1">
                {extractedFields.first_name && (
                  <div>
                    <span className="font-medium">First Name:</span>{' '}
                    {extractedFields.first_name}
                  </div>
                )}
                {extractedFields.last_name && (
                  <div>
                    <span className="font-medium">Last Name:</span>{' '}
                    {extractedFields.last_name}
                  </div>
                )}
                {extractedFields.date_of_birth && (
                  <div>
                    <span className="font-medium">Date of Birth:</span>{' '}
                    {extractedFields.date_of_birth}
                  </div>
                )}
                {extractedFields.phone && (
                  <div>
                    <span className="font-medium">Phone:</span>{' '}
                    {extractedFields.phone}
                  </div>
                )}
                {extractedFields.email && (
                  <div>
                    <span className="font-medium">Email:</span>{' '}
                    {extractedFields.email}
                  </div>
                )}
                {extractedFields.address && (
                  <div>
                    <span className="font-medium">Address:</span>{' '}
                    {extractedFields.address}
                  </div>
                )}
                {extractedFields.custom_fields.household_size !== null && (
                  <div>
                    <span className="font-medium">Household Size:</span>{' '}
                    {extractedFields.custom_fields.household_size}
                  </div>
                )}
                {extractedFields.custom_fields.dietary_restrictions && (
                  <div>
                    <span className="font-medium">Dietary Restrictions:</span>{' '}
                    {extractedFields.custom_fields.dietary_restrictions}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button onClick={handleUseFields} className="flex-1">
                  Use These Fields
                </Button>
                <Button variant="outline" onClick={handleClose}>
                  <X className="h-4 w-4" aria-hidden="true" />
                  <span className="sr-only">Discard</span>
                </Button>
              </div>
            </div>
          )}

          {/* Error state */}
          {status === 'error' && (
            <div className="space-y-3">
              <p className="text-sm text-destructive">{errorMessage}</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleButtonClick}
                  className="flex-1"
                >
                  Try Another Image
                </Button>
                <Button variant="ghost" onClick={handleClose}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the data URI prefix (data:image/jpeg;base64,...)
      const base64 = result.split(',')[1];
      if (!base64) reject(new Error('Failed to read file'));
      else resolve(base64);
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}
