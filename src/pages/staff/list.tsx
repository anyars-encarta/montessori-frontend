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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HttpError, useDelete, useNotification } from "@refinedev/core";
import { useTable } from "@refinedev/react-table";
import { ColumnDef } from "@tanstack/react-table";
import { Loader2, Search } from "lucide-react";

import { StaffListRecord } from "@/types";

const extractErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }
  return fallback;
};

const ListStaff = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStaffType, setSelectedStaffType] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [staffPendingDelete, setStaffPendingDelete] =
    useState<StaffListRecord | null>(null);
  const [deleteBlockedReason, setDeleteBlockedReason] = useState<string | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const { open } = useNotification();
  const { mutateAsync: deleteStaff } = useDelete();

  const filters = useMemo(() => {
    const values: Array<{
      field: string;
      operator: "contains" | "eq";
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

    if (selectedStaffType) {
      values.push({
        field: "staffType",
        operator: "eq",
        value: selectedStaffType,
      });
    }

    if (selectedStatus) {
      values.push({
        field: "isActive",
        operator: "eq",
        value: selectedStatus,
      });
    }

    return values;
  }, [searchQuery, selectedStaffType, selectedStatus]);

  const staffTable = useTable<StaffListRecord>({
    columns: useMemo<ColumnDef<StaffListRecord>[]>(
      () => [
        {
          id: "name",
          accessorFn: (row) => `${row.firstName} ${row.lastName}`.trim(),
          size: 210,
          header: () => <p className="column-title">Staff</p>,
          cell: ({ row }) => (
            <div className="flex items-center gap-3">
              {row.original.cloudinaryImageUrl ? (
                <img
                  src={row.original.cloudinaryImageUrl}
                  alt={`${row.original.firstName} ${row.original.lastName}`}
                  className="h-8 w-8 rounded object-cover"
                />
              ) : (
                <div className="h-8 w-8 rounded bg-muted" />
              )}
              <div>
                <p className="font-medium">
                  {row.original.firstName} {row.original.lastName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {row.original.registrationNumber ?? "No Reg. Number"}
                </p>
              </div>
            </div>
          ),
        },
        {
          id: "staffType",
          accessorKey: "staffType",
          size: 120,
          header: () => <p className="column-title">Type</p>,
          cell: ({ getValue }) => (
            <Badge variant="secondary" className="capitalize">
              {String(getValue() ?? "").replace("_", " ")}
            </Badge>
          ),
        },
        {
          id: "email",
          accessorKey: "email",
          size: 190,
          header: () => <p className="column-title">Email</p>,
          cell: ({ getValue }) => (
            <span className="text-muted-foreground">
              {getValue<string | null>() ?? "N/A"}
            </span>
          ),
        },
        {
          id: "phone",
          size: 90,
          header: () => <p className="column-title">Phone</p>,
          cell: ({ row }) => <span>{row.original.phone ?? null}</span>,
        },
        {
          id: "subjects",
          size: 90,
          header: () => <p className="column-title">Subjects</p>,
          cell: ({ row }) => <span>{row.original.subjects?.length ?? 0}</span>,
        },
        {
          id: "status",
          accessorKey: "isActive",
          size: 100,
          header: () => <p className="column-title">Status</p>,
          cell: ({ getValue }) => {
            const active = Boolean(getValue<boolean>());
            return (
              <Badge variant={active ? "default" : "secondary"}>
                {active ? "Active" : "Inactive"}
              </Badge>
            );
          },
        },
        {
          id: "actions",
          size: 170,
          header: () => <p className="column-title">Actions</p>,
          cell: ({ row }) => (
            <div className="flex items-center gap-2">
              <ShowButton
                resource="staff"
                recordItemId={row.original.id}
                variant="outline"
                size="sm"
              >
                <ActionButton type="view" />
              </ShowButton>
              <EditButton
                resource="staff"
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
                onClick={() => setStaffPendingDelete(row.original)}
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
      resource: "staff",
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
    if (!staffPendingDelete || isDeleting) return;

    setIsDeleting(true);
    try {
      await deleteStaff(
        {
          resource: "staff",
          id: staffPendingDelete.id,
          successNotification: false,
          errorNotification: false,
        },
        {
          onSuccess: () => {
            setStaffPendingDelete(null);
          },
        },
      );

      open?.({
        type: "success",
        message: "Staff deleted",
        description: `"${staffPendingDelete.firstName} ${staffPendingDelete.lastName}" was deleted successfully.`,
      });
    } catch (error) {
      const statusCode =
        error && typeof error === "object" && "statusCode" in error
          ? Number((error as HttpError).statusCode)
          : undefined;
      const reason = extractErrorMessage(error, "Could not delete staff member.");

      if (statusCode === 409) {
        setDeleteBlockedReason(reason);
      } else {
        open?.({
          type: "error",
          message: "Delete failed",
          description: reason,
        });
      }

      setStaffPendingDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const hasActiveFilters =
    Boolean(searchQuery.trim()) || Boolean(selectedStaffType) || Boolean(selectedStatus);

  return (
    <ListView>
      <Breadcrumb />

      <h1 className="page-title">Staff</h1>

      <div className="intro-row">
        <p>Manage teaching and non-teaching staff records.</p>

        <div className="actions-row">
          <div className="search-field">
            <Search className="search-icon" />
            <Input
              type="text"
              placeholder="Search by name, email, or phone"
              className="pl-10 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="w-full sm:w-[170px]">
            <Select
              value={selectedStaffType || "all"}
              onValueChange={(value) =>
                setSelectedStaffType(value === "all" ? "" : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="teacher">Teacher</SelectItem>
                <SelectItem value="non_teaching">Non teaching</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-full sm:w-[150px]">
            <Select
              value={selectedStatus || "all"}
              onValueChange={(value) => setSelectedStatus(value === "all" ? "" : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <CreateButton resource="staff" />

          {hasActiveFilters && (
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer"
              onClick={() => {
                setSearchQuery("");
                setSelectedStaffType("");
                setSelectedStatus("");
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
      </div>

      <DataTable table={staffTable} />

      <AlertDialog
        open={Boolean(staffPendingDelete)}
        onOpenChange={(openState) => {
          if (!openState && !isDeleting) {
            setStaffPendingDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete staff member?</AlertDialogTitle>
            <AlertDialogDescription>
              {staffPendingDelete
                ? `This will permanently delete "${staffPendingDelete.firstName} ${staffPendingDelete.lastName}".`
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
            <AlertDialogTitle>Staff member cannot be deleted</AlertDialogTitle>
            <AlertDialogDescription>{deleteBlockedReason}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>Understood</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ListView>
  );
};

export default ListStaff;