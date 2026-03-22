import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";

import PageLoader from "@/components/PageLoader";
import {
  EditView,
  EditViewHeader,
} from "@/components/refine-ui/views/edit-view";
import UploadWidget from "@/components/upload-widget";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AcademicYearForm, AcademicYearRecord, SchoolDetailsForm, SchoolDetailsRecord, TermForm, TermRecord, UploadWidgetValue } from "@/types";
import {
  useCreate,
  useDelete,
  useList,
  useNotification,
  useUpdate,
} from "@refinedev/core";

const emptySchool: SchoolDetailsForm = {
  name: "",
  address: "",
  phone: "",
  email: "",
  website: "",
  logo: "",
  discountType: "value",
  discountAmount: "0",
};

const emptyAcademicYear: AcademicYearForm = {
  year: "",
  startDate: "",
  endDate: "",
};

const emptyTerm: TermForm = {
  name: "",
  sequenceNumber: "",
  academicYearId: "",
  startDate: "",
  endDate: "",
  holidayDatesText: "",
};

const CURRENCY_SYMBOL = "$";

const normalizeDiscountAmount = (
  value: string,
  discountType: "value" | "percentage",
) => {
  if (!value.trim()) return "";

  const parsedValue = Number.parseFloat(value);
  if (Number.isNaN(parsedValue)) return value;

  const bounded = discountType === "percentage" ? Math.min(parsedValue, 100) : parsedValue;
  return String(Math.max(0, bounded));
};

const formatDate = (date: string) => {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "N/A";
  return parsed.toLocaleDateString();
};

const extractErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }
  return fallback;
};

const serializeHolidayDates = (holidayDates?: string[]) => {
  if (!Array.isArray(holidayDates) || holidayDates.length === 0) {
    return "";
  }

  return holidayDates.join("\n");
};

const parseHolidayDatesText = (value: string) => {
  const parts = value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);

  return [...new Set(parts)].sort((a, b) => a.localeCompare(b));
};

const EditSetup = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { open } = useNotification();

  const { mutateAsync: createRecord } = useCreate();
  const { mutateAsync: updateRecord } = useUpdate();
  const { mutateAsync: deleteRecord } = useDelete();

  const { query: schoolQuery, result: schoolResult } = useList<SchoolDetailsRecord>({
    resource: "school-details",
    pagination: { pageSize: 100 },
  });

  const { query: yearsQuery, result: yearsResult } = useList<AcademicYearRecord>({
    resource: "academic-years",
    pagination: { pageSize: 200 },
  });

  const { query: termsQuery, result: termsResult } = useList<TermRecord>({
    resource: "terms",
    pagination: { pageSize: 500 },
  });

  const schoolRows = schoolResult.data;
  const academicYears = yearsResult.data;
  const terms = termsResult.data;

  const selectedSchool = useMemo(() => {
    if (!schoolRows.length) return null;
    if (!id) return schoolRows[0];
    return schoolRows.find((row) => String(row.id) === String(id)) ?? schoolRows[0];
  }, [id, schoolRows]);

  const [schoolForm, setSchoolForm] = useState<SchoolDetailsForm>(emptySchool);
  const [academicYearForm, setAcademicYearForm] =
    useState<AcademicYearForm>(emptyAcademicYear);
  const [termForm, setTermForm] = useState<TermForm>(emptyTerm);
  const [editingAcademicYearId, setEditingAcademicYearId] = useState<number | null>(null);
  const [editingTermId, setEditingTermId] = useState<number | null>(null);
  const [isSavingSchool, setIsSavingSchool] = useState(false);
  const [isSavingAcademicYear, setIsSavingAcademicYear] = useState(false);
  const [isSavingTerm, setIsSavingTerm] = useState(false);

  const handleLogoChange = (value: UploadWidgetValue | null) => {
    setSchoolForm((prev) => ({
      ...prev,
      logo: value?.url ?? "",
    }));
  };

  useEffect(() => {
    if (!selectedSchool) return;
    setSchoolForm({
      name: selectedSchool.name,
      address: selectedSchool.address,
      phone: selectedSchool.phone,
      email: selectedSchool.email,
      website: selectedSchool.website ?? "",
      logo: selectedSchool.logo ?? "",
      discountType: selectedSchool.discountType,
      discountAmount: String(selectedSchool.discountAmount ?? "0"),
    });
  }, [selectedSchool]);

  const yearById = useMemo(() => {
    return new Map(academicYears.map((year) => [year.id, year]));
  }, [academicYears]);

  const onSaveSchool = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedSchool) {
      open?.({ type: "error", message: "No school details record to edit" });
      return;
    }

    setIsSavingSchool(true);
    try {
      await updateRecord({
        resource: "school-details",
        id: selectedSchool.id,
        values: {
          ...schoolForm,
          website: schoolForm.website.trim() || null,
          logo: schoolForm.logo.trim() || null,
          discountAmount: schoolForm.discountAmount.trim() || "0",
        },
      });

      open?.({ type: "success", message: "School information updated" });
    } catch (error) {
      open?.({
        type: "error",
        message: "Update failed",
        description: extractErrorMessage(error, "Failed to update school details"),
      });
    } finally {
      setIsSavingSchool(false);
    }
  };

  const onSaveAcademicYear = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSavingAcademicYear(true);

    const payload = {
      year: academicYearForm.year,
      startDate: academicYearForm.startDate,
      endDate: academicYearForm.endDate,
    };

    try {
      if (editingAcademicYearId) {
        await updateRecord({
          resource: "academic-years",
          id: editingAcademicYearId,
          values: payload,
          successNotification: false,
          errorNotification: false,
        });
        open?.({ type: "success", message: "Academic year updated" });
      } else {
        await createRecord({
          resource: "academic-years",
          values: payload,
          successNotification: false,
          errorNotification: false,
        });
        open?.({ type: "success", message: "Academic year created" });
      }

      setEditingAcademicYearId(null);
      setAcademicYearForm(emptyAcademicYear);
      await yearsQuery.refetch();
    } catch (error) {
      open?.({
        type: "error",
        message: "Academic year save failed",
        description: extractErrorMessage(error, "Failed to save academic year"),
      });
    } finally {
      setIsSavingAcademicYear(false);
    }
  };

  const onDeleteAcademicYear = async (recordId: number) => {
    try {
      await deleteRecord({ resource: "academic-years", id: recordId });
      open?.({ type: "success", message: "Academic year deleted" });
      await Promise.all([yearsQuery.refetch(), termsQuery.refetch()]);

      if (editingAcademicYearId === recordId) {
        setEditingAcademicYearId(null);
        setAcademicYearForm(emptyAcademicYear);
      }
    } catch (error) {
      open?.({
        type: "error",
        message: "Delete failed",
        description: extractErrorMessage(error, "Failed to delete academic year"),
      });
    }
  };

  const onSaveTerm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSavingTerm(true);

    const payload = {
      name: termForm.name,
      sequenceNumber: Number.parseInt(termForm.sequenceNumber, 10),
      academicYearId: Number.parseInt(termForm.academicYearId, 10),
      startDate: termForm.startDate,
      endDate: termForm.endDate,
      holidayDates: parseHolidayDatesText(termForm.holidayDatesText),
    };

    try {
      if (editingTermId) {
        await updateRecord({ resource: "terms", id: editingTermId, values: payload });
        open?.({ type: "success", message: "Term updated" });
      } else {
        await createRecord({ resource: "terms", values: payload });
        open?.({ type: "success", message: "Term created" });
      }

      setEditingTermId(null);
      setTermForm(emptyTerm);
      await termsQuery.refetch();
    } catch (error) {
      open?.({
        type: "error",
        message: "Term save failed",
        description: extractErrorMessage(error, "Failed to save term"),
      });
    } finally {
      setIsSavingTerm(false);
    }
  };

  const onDeleteTerm = async (recordId: number) => {
    try {
      await deleteRecord({ resource: "terms", id: recordId });
      open?.({ type: "success", message: "Term deleted" });
      await termsQuery.refetch();

      if (editingTermId === recordId) {
        setEditingTermId(null);
        setTermForm(emptyTerm);
      }
    } catch (error) {
      open?.({
        type: "error",
        message: "Delete failed",
        description: extractErrorMessage(error, "Failed to delete term"),
      });
    }
  };

  if (schoolQuery.isLoading || yearsQuery.isLoading || termsQuery.isLoading) {
    return (
      <EditView>
        <PageLoader />
      </EditView>
    );
  }

  if (!selectedSchool) {
    return (
      <EditView className="space-y-4">
        <EditViewHeader resource="setup" title="Edit Setup" />
        <Card>
          <CardContent className="pt-6 space-y-4">
            <p className="text-sm text-muted-foreground">
              No school details found. Create school setup first.
            </p>
            <div>
              <Button className="cursor-pointer" onClick={() => navigate("/setup/create")}>Go to Create Setup</Button>
            </div>
          </CardContent>
        </Card>
      </EditView>
    );
  }

  return (
    <EditView className="space-y-6">
      <EditViewHeader resource="setup" title="Edit Setup" />

      <Card>
        <CardHeader>
          <CardTitle>School Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSaveSchool}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="school-name">School Name</Label>
                <Input
                  id="school-name"
                  value={schoolForm.name}
                  onChange={(event) =>
                    setSchoolForm((prev) => ({ ...prev, name: event.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="school-phone">Phone</Label>
                <Input
                  id="school-phone"
                  value={schoolForm.phone}
                  onChange={(event) =>
                    setSchoolForm((prev) => ({ ...prev, phone: event.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="school-address">Address</Label>
                <Input
                  id="school-address"
                  value={schoolForm.address}
                  onChange={(event) =>
                    setSchoolForm((prev) => ({ ...prev, address: event.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="school-email">Email</Label>
                <Input
                  id="school-email"
                  type="email"
                  value={schoolForm.email}
                  onChange={(event) =>
                    setSchoolForm((prev) => ({ ...prev, email: event.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="school-website">Website</Label>
                <Input
                  id="school-website"
                  value={schoolForm.website}
                  onChange={(event) =>
                    setSchoolForm((prev) => ({ ...prev, website: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Discount Type</Label>
                <Select
                  value={schoolForm.discountType}
                  onValueChange={(value: "value" | "percentage") => {
                    setSchoolForm((prev) => ({
                      ...prev,
                      discountType: value,
                      discountAmount: normalizeDiscountAmount(prev.discountAmount, value),
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select discount type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="value">Value</SelectItem>
                    <SelectItem value="percentage">Percentage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="school-discount-amount">Discount Amount</Label>
                <div className="relative">
                  {schoolForm.discountType === "value" && (
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      {CURRENCY_SYMBOL}
                    </span>
                  )}
                  <Input
                    id="school-discount-amount"
                    type="number"
                    min={0}
                    max={schoolForm.discountType === "percentage" ? 100 : undefined}
                    step="0.01"
                    className={schoolForm.discountType === "value" ? "pl-7" : ""}
                    value={schoolForm.discountAmount}
                    onChange={(event) =>
                      setSchoolForm((prev) => ({
                        ...prev,
                        discountAmount: normalizeDiscountAmount(
                          event.target.value,
                          prev.discountType,
                        ),
                      }))
                    }
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {schoolForm.discountType === "percentage"
                    ? "Enter 0 to 100 for percentage discounts."
                    : `Enter the fixed amount in ${CURRENCY_SYMBOL}.`}
                </p>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>School Logo</Label>
                <UploadWidget
                  value={
                    schoolForm.logo
                      ? {
                          url: schoolForm.logo,
                          publicId: "",
                        }
                      : null
                  }
                  onChange={handleLogoChange}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" className="cursor-pointer" disabled={isSavingSchool}>
                {isSavingSchool ? "Saving..." : "Update School Information"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manage Academic Years</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="grid gap-4 md:grid-cols-4" onSubmit={onSaveAcademicYear}>
            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                type="text"
                value={academicYearForm.year}
                onChange={(event) =>
                  setAcademicYearForm((prev) => ({ ...prev, year: event.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="year-start">Start Date</Label>
              <Input
                id="year-start"
                type="date"
                value={academicYearForm.startDate}
                onChange={(event) =>
                  setAcademicYearForm((prev) => ({ ...prev, startDate: event.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="year-end">End Date</Label>
              <Input
                id="year-end"
                type="date"
                value={academicYearForm.endDate}
                onChange={(event) =>
                  setAcademicYearForm((prev) => ({ ...prev, endDate: event.target.value }))
                }
                required
              />
            </div>
            <div className="flex items-end gap-2">
              <Button type="submit" className="cursor-pointer" disabled={isSavingAcademicYear}>
                {isSavingAcademicYear
                  ? "Saving..."
                  : editingAcademicYearId
                    ? "Update"
                    : "Add"}
              </Button>
              {editingAcademicYearId && (
                <Button
                  type="button"
                  variant="outline"
                  className="cursor-pointer"
                  onClick={() => {
                    setEditingAcademicYearId(null);
                    setAcademicYearForm(emptyAcademicYear);
                  }}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>

          <div className="space-y-2">
            {academicYears.length === 0 ? (
              <p className="text-sm text-muted-foreground">No academic years configured.</p>
            ) : (
              academicYears.map((year) => (
                <div
                  key={year.id}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div>
                    <p className="font-medium">{year.year}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(year.startDate)} - {formatDate(year.endDate)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="cursor-pointer"
                      onClick={() => {
                        setEditingAcademicYearId(year.id);
                        setAcademicYearForm({
                          year: String(year.year),
                          startDate: year.startDate,
                          endDate: year.endDate,
                        });
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      className="cursor-pointer"
                      onClick={() => onDeleteAcademicYear(year.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manage Terms</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="grid gap-4 md:grid-cols-6" onSubmit={onSaveTerm}>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="term-name">Term Name</Label>
              <Input
                id="term-name"
                value={termForm.name}
                onChange={(event) =>
                  setTermForm((prev) => ({ ...prev, name: event.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="term-seq">Sequence</Label>
              <Input
                id="term-seq"
                type="number"
                min={1}
                value={termForm.sequenceNumber}
                onChange={(event) =>
                  setTermForm((prev) => ({ ...prev, sequenceNumber: event.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Academic Year</Label>
              <Select
                value={termForm.academicYearId}
                onValueChange={(value) =>
                  setTermForm((prev) => ({ ...prev, academicYearId: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select academic year" />
                </SelectTrigger>
                <SelectContent>
                  {academicYears.map((year) => (
                    <SelectItem key={year.id} value={String(year.id)}>
                      {year.year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="term-start">Start Date</Label>
              <Input
                id="term-start"
                type="date"
                value={termForm.startDate}
                onChange={(event) =>
                  setTermForm((prev) => ({ ...prev, startDate: event.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="term-end">End Date</Label>
              <Input
                id="term-end"
                type="date"
                value={termForm.endDate}
                onChange={(event) =>
                  setTermForm((prev) => ({ ...prev, endDate: event.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-2 md:col-span-6">
              <Label htmlFor="term-holidays">Holiday Dates</Label>
              <Textarea
                id="term-holidays"
                rows={4}
                value={termForm.holidayDatesText}
                onChange={(event) =>
                  setTermForm((prev) => ({ ...prev, holidayDatesText: event.target.value }))
                }
                placeholder="Enter dates in YYYY-MM-DD format, one per line or comma-separated"
              />
              <p className="text-xs text-muted-foreground">
                These dates are excluded from attendance working-day totals for this term.
              </p>
            </div>
            <div className="flex items-end gap-2 md:col-span-2">
              <Button
                type="submit"
                className="cursor-pointer"
                disabled={isSavingTerm || academicYears.length === 0}
              >
                {isSavingTerm ? "Saving..." : editingTermId ? "Update" : "Add"}
              </Button>
              {editingTermId && (
                <Button
                  type="button"
                  variant="outline"
                  className="cursor-pointer"
                  onClick={() => {
                    setEditingTermId(null);
                    setTermForm(emptyTerm);
                  }}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>

          <div className="space-y-2">
            {terms.length === 0 ? (
              <p className="text-sm text-muted-foreground">No terms configured.</p>
            ) : (
              terms.map((term) => (
                <div
                  key={term.id}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div>
                    <p className="font-medium">
                      {term.name} (Term {term.sequenceNumber})
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Year: {yearById.get(term.academicYearId)?.year ?? "N/A"} • {formatDate(term.startDate)} - {formatDate(term.endDate)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Holidays: {Array.isArray(term.holidayDates) ? term.holidayDates.length : 0}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="cursor-pointer"
                      onClick={() => {
                        setEditingTermId(term.id);
                        setTermForm({
                          name: term.name,
                          sequenceNumber: String(term.sequenceNumber),
                          academicYearId: String(term.academicYearId),
                          startDate: term.startDate,
                          endDate: term.endDate,
                          holidayDatesText: serializeHolidayDates(term.holidayDates),
                        });
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      className="cursor-pointer"
                      onClick={() => onDeleteTerm(term.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </EditView>
  );
};

export default EditSetup;