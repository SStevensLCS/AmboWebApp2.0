import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6 text-center space-y-4">
          <h2 className="text-4xl font-bold text-muted-foreground">404</h2>
          <p className="text-lg font-medium">Page not found</p>
          <p className="text-sm text-muted-foreground">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
          <Button asChild variant="outline">
            <Link href="/">Go home</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
