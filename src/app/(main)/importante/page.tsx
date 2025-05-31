import fs from 'fs/promises';
import path from 'path';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

async function getImportantInfo() {
  try {
    // Construct path relative to the current file or a known project root
    // For app router, files in the same directory are easiest.
    const filePath = path.join(process.cwd(), 'src', 'app', '(main)', 'importante', 'important-info.txt');
    const data = await fs.readFile(filePath, 'utf-8');
    return data;
  } catch (error) {
    console.error("Failed to read important info:", error);
    return "Could not load important information. Please check server logs.";
  }
}

export default async function ImportantePage() {
  const info = await getImportantInfo();

  return (
    <div className="max-w-3xl mx-auto">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center gap-2">
          <AlertTriangle className="h-8 w-8 text-destructive" />
          <CardTitle className="text-3xl font-headline text-primary">Información Importante</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-lg max-w-none dark:prose-invert whitespace-pre-line text-foreground">
            {info}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
