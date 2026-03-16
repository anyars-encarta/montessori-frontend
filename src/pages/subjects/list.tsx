import { useMemo, useState } from "react";

import ActionButton from "@/components/actionButton";
import { CreateButton } from "@/components/refine-ui/buttons/create";
import { EditButton } from "@/components/refine-ui/buttons/edit";
import { ShowButton } from "@/components/refine-ui/buttons/show";
import { DataTable } from "@/components/refine-ui/data-table/data-table";
import { Breadcrumb } from "@/components/refine-ui/layout/breadcrumb";
import { ListView } from "@/components/refine-ui/views/list-view";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SubjectRecord } from "@/types";
import { HttpError, useDelete, useNotification } from "@refinedev/core";
import { useTable } from "@refinedev/react-table";
import { ColumnDef } from "@tanstack/react-table";
import { Loader2, Search } from "lucide-react";

const extractErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }
  return fallback;
};

const ListSubjects = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectPendingDelete, setSubjectPendingDelete] =
    useState<SubjectRecord | null>(null);
  const [deleteBlockedReason, setDeleteBlockedReason] = useState<string | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const { open } = useNotification();
  const { mutateAsync: deleteSubject } = useDelete();

  const filters = useMemo(() => {
    const values: Array<{
      field: string;
      operator: "contains";
      value: string;
    }> = [];

    const normalizedSearch = searchQuery.trim();
    if (normalizedSearch) {
      values.push({
        field: "search",
        operator: "contains",
        value: normalizedSearch,
      });
    }

    return values;
  }, [searchQuery]);

  const subjectTable = useTable<SubjectRecord>({
    columns: useMemo<ColumnDef<SubjectRecord>[]>(
      () => [
        {
          id: "name",
          accessorKey: "name",
          size: 190,
          header: () => <p className="column-title">Subject</p>,
          cell: ({ row }) => (
            <div className="flex items-center gap-3">
              {row.original.cloudinaryImageUrl ? (
                <img
                  src={row.original.cloudinaryImageUrl}
                  alt={row.original.name}
                  className="h-8 w-8 rounded object-cover"
                />
              ) : (
                <div className="h-8 w-8 rounded bg-muted" />
              )}
              <span className="font-medium">{row.original.name}</span>
            </div>
          ),
        },
        {
          id: "code",
          accessorKey: "code",
          size: 110,
          header: () => <p className="column-title">Code</p>,
          cell: ({ getValue }) => {
            const code = getValue<string | null>();
            return code ? (
              <Badge variant="secondary">{code}</Badge>
            ) : (
              <span className="text-muted-foreground">N/A</span>
            );
          },
        },
        {
          id: "description",
          accessorKey: "description",
          size: 280,
          header: () => <p className="column-title">Description</p>,
          cell: ({ getValue }) => {
            const description = getValue<string | null>();
            return (
              <span className="line-clamp-1 text-muted-foreground">
                {description || "No description"}
              </span>
            );
          },
        },
        {
          id: "actions",
          size: 160,
          header: () => <p className="column-title">Actions</p>,
          cell: ({ row }) => (
            <div className="flex items-center gap-2">
              <ShowButton
                resource="subjects"
                recordItemId={row.original.id}
                variant="outline"
                size="sm"
              >
                <ActionButton type="view" />
              </ShowButton>
              <EditButton
                resource="subjects"
                recordItemId={row.original.id}
                variant="outline"
                size="sm"
              >
                <ActionButton type="update" />
              </EditButton>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="cursor-pointer"
                onClick={() => setSubjectPendingDelete(row.original)}
              >
                <ActionButton type="delete" />
              </Button>
            </div>
          ),
        },
      ],
      [],
    ),
    refineCoreProps: {
      resource: "subjects",
      pagination: { pageSize: 10, mode: "server" },
      filters: {
        permanent: [...filters],
      },
      sorters: {
        initial: [{ field: "id", order: "desc" }],
      },
    },
  });

  const handleConfirmDelete = async () => {
    if (!subjectPendingDelete || isDeleting) return;

    setIsDeleting(true);
    try {
      await deleteSubject(
        {
          resource: "subjects",
          id: subjectPendingDelete.id,
          successNotification: false,
          errorNotification: false,
        },
        {
          onSuccess: () => {
            setSubjectPendingDelete(null);
          },
        },
      );

      open?.({
        type: "success",
        message: "Subject deleted",
        description: `"${subjectPendingDelete.name}" was deleted successfully.`,
      });
    } catch (error) {
      const statusCode =
        error && typeof error === "object" && "statusCode" in error
          ? Number((error as HttpError).statusCode)
          : undefined;
      const reason = extractErrorMessage(
        error,
        "We could not delete this subject right now.",
      );

      if (statusCode === 409) {
        setDeleteBlockedReason(reason);
      } else {
        open?.({
          type: "error",
          message: "Delete failed",
          description: reason,
        });
      }

      setSubjectPendingDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <ListView>
      <Breadcrumb />

      <h1 className="page-title">Subjects</h1>

      <div className="intro-row">
        <p>Manage subjects taught in the school.</p>

        <div className="actions-row">
          <div className="search-field">
            <Search className="search-icon" />
            <Input
              type="text"
              placeholder="Search by name, code, or description"
              className="pl-10 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <CreateButton resource="subjects" />

          {searchQuery.trim().length > 0 && (
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer"
              onClick={() => setSearchQuery("")}
            >
              Clear filters
            </Button>
          )}
        </div>
      </div>

      <DataTable table={subjectTable} />

      <AlertDialog
        open={Boolean(subjectPendingDelete)}
        onOpenChange={(openState) => {
          if (!openState && !isDeleting) {
            setSubjectPendingDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete subject?</AlertDialogTitle>
            <AlertDialogDescription>
              {subjectPendingDelete
                ? `This will permanently delete "${subjectPendingDelete.name}".`
                : "This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async (event) => {
                event.preventDefault();
                await handleConfirmDelete();
              }}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting...
                </span>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={Boolean(deleteBlockedReason)}
        onOpenChange={(openState) => {
          if (!openState) {
            setDeleteBlockedReason(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Subject cannot be deleted yet</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteBlockedReason}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>Understood</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ListView>
  );
};

export default ListSubjects;