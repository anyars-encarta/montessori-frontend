import { FormEvent, useState } from "react";
import { useNavigate } from "react-router";

import { CreateView, CreateViewHeader } from "@/components/refine-ui/views/create-view";
import UploadWidget from "@/components/upload-widget";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UploadWidgetValue } from "@/types";
import { useCreate, useNotification } from "@refinedev/core";

type SchoolDetailsForm = {
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  logo: string;
};

const initialValues: SchoolDetailsForm = {
  name: "",
  address: "",
  phone: "",
  email: "",
  website: "",
  logo: "",
};

const CreateSetup = () => {
  const navigate = useNavigate();
  const { open } = useNotification();
  const { mutateAsync } = useCreate();
  const [isSaving, setIsSaving] = useState(false);
  const [formValues, setFormValues] = useState<SchoolDetailsForm>(initialValues);

  const handleLogoChange = (value: UploadWidgetValue | null) => {
    setFormValues((prev) => ({
      ...prev,
      logo: value?.url ?? "",
    }));
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setIsSaving(true);
      const payload = {
        ...formValues,
        website: formValues.website.trim() || null,
        logo: formValues.logo.trim() || null,
      };

      const response = await mutateAsync({
        resource: "school-details",
        values: payload,
      });

      const createdId = response?.data?.id;

      open?.({
        type: "success",
        message: "School details created",
      });

      if (createdId) {
        navigate(`/setup/edit/${createdId}`);
      } else {
        navigate("/setup/show");
      }
    } catch (error) {
      const message =
        error && typeof error === "object" && "message" in error
          ? String(error.message)
          : "Failed to create school details";
      open?.({ type: "error", message: "Create failed", description: message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <CreateView className="space-y-6">
      <CreateViewHeader resource="setup" title="Create School Setup" />

      <Card>
        <CardHeader>
          <CardTitle>School Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">School Name</Label>
                <Input
                  id="name"
                  value={formValues.name}
                  onChange={(event) =>
                    setFormValues((prev) => ({ ...prev, name: event.target.value }))
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formValues.phone}
                  onChange={(event) =>
                    setFormValues((prev) => ({ ...prev, phone: event.target.value }))
                  }
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formValues.address}
                  onChange={(event) =>
                    setFormValues((prev) => ({ ...prev, address: event.target.value }))
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formValues.email}
                  onChange={(event) =>
                    setFormValues((prev) => ({ ...prev, email: event.target.value }))
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={formValues.website}
                  onChange={(event) =>
                    setFormValues((prev) => ({ ...prev, website: event.target.value }))
                  }
                  placeholder="https://example.com"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>School Logo</Label>
                <UploadWidget
                  value={
                    formValues.logo
                      ? {
                          url: formValues.logo,
                          publicId: "",
                        }
                      : null
                  }
                  onChange={handleLogoChange}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save School Details"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </CreateView>
  );
};

export default CreateSetup;