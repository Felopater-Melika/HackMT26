"use client";

import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function DownloadReportButton({ reportId }: { reportId: string }) {
  const { mutate: generatePDF, isPending } = api.reports.generateAllPDF.useMutation({
    onSuccess: (data) => {
      // Convert base64 to blob and trigger download
      const byteCharacters = atob(data.data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "application/pdf" });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = data.filename;
      a.click();
      URL.revokeObjectURL(url);

      toast.success("PDF downloaded successfully!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to generate PDF");
    },
  });

  return (
    <Button
      onClick={() => generatePDF({ reportId } as any)}
      disabled={isPending}
      variant="outline"
    >
      {isPending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Download className="mr-2 h-4 w-4" />
          Download PDF
        </>
      )}
    </Button>
  );
}