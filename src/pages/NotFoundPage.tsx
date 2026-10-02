import { Compass } from "lucide-react";
import { Link } from "react-router";
import { Card } from "@/components/common/Card";
import { EmptyState } from "@/components/common/EmptyState";

export default function NotFoundPage() {
  return (
    <Card>
      <EmptyState
        icon={Compass}
        title="Page not found"
        description="The page you're looking for doesn't exist."
        action={
          <Link to="/" className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-fg hover:bg-primary-hover">
            Back to dashboard
          </Link>
        }
      />
    </Card>
  );
}
