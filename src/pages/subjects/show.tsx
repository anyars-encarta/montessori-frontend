import { useParams } from "react-router";
import { AdvancedImage } from "@cloudinary/react";
import PageLoader from "@/components/PageLoader";
import { Breadcrumb } from "@/components/refine-ui/layout/breadcrumb";
import {
  ShowView,
} from "@/components/refine-ui/views/show-view";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SubjectRecord } from "@/types";
import { useBack, useOne } from "@refinedev/core";
import { bannerPhoto } from "@/lib/cloudinary";

const ShowSubject = () => {
  const back = useBack();
  const { id } = useParams();
  const subjectId = id ?? "";

  const { query: subjectQuery } = useOne<SubjectRecord>({
    resource: "subjects",
    id: subjectId,
    queryOptions: {
      enabled: Boolean(subjectId),
    },
  });

  const subject = subjectQuery.data?.data ?? null;

  if (subjectQuery.isLoading) {
    return (
      <ShowView>
        <Breadcrumb />
        <PageLoader />
      </ShowView>
    );
  }

  if (subjectQuery.isError || !subject) {
    return (
      <ShowView>
        <Breadcrumb />
        <p className="text-sm text-destructive">
          Failed to load subject details.
        </p>
      </ShowView>
    );
  }

  return (
    <ShowView className="class-view class-show space-y-6">
      <Breadcrumb />

      <div className="intro-row">
        <h1 className="page-title">Subject Details</h1>
        <Button onClick={back} className="cursor-pointer" type="button">
          Go Back
        </Button>
      </div>
      <Separator />

      <div className="banner">
        {subject.cloudinaryImageUrl ? (
          subject.cloudinaryImageUrl.includes("res.cloudinary.com") &&
          subject.imageCldPubId ? (
            <AdvancedImage
              cldImg={bannerPhoto(
                subject.imageCldPubId ?? "",
                subject.name,
              )}
              alt="Subject Banner"
            />
          ) : (
            <img
              src={subject.cloudinaryImageUrl}
              alt={subject.name}
              loading="lazy"
            />
          )
        ) : (
          <div className="placeholder" />
        )}
      </div>

      <Card className="details-card">
        <CardHeader>
          <CardTitle>{subject.name}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">Subject Code</p>
            {subject.code ? (
              <Badge variant="secondary" className="mt-1">
                {subject.code}
              </Badge>
            ) : (
              <p className="font-medium">N/A</p>
            )}
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Created At</p>
            <p className="font-medium">
              {new Date(subject.createdAt).toLocaleString()}
            </p>
          </div>

          <div className="md:col-span-2">
            <p className="text-sm text-muted-foreground">Description</p>
            <p className="font-medium">{subject.description ?? "N/A"}</p>
          </div>
        </CardContent>
      </Card>
    </ShowView>
  );
};

export default ShowSubject;
