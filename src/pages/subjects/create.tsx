import { Breadcrumb } from "@/components/refine-ui/layout/breadcrumb";
import { CreateView } from "@/components/refine-ui/views/create-view";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import UploadWidget from "@/components/upload-widget";
import { createSubjectSchema, CreateSubjectValues } from "@/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { BaseRecord, HttpError, useBack } from "@refinedev/core";
import { useForm } from "@refinedev/react-hook-form";
import { Loader2 } from "lucide-react";
import { SubmitHandler } from "react-hook-form";

const CreateSubject = () => {
  const back = useBack();

  const form = useForm<BaseRecord, HttpError, CreateSubjectValues>({
    resolver: zodResolver(createSubjectSchema),
    refineCoreProps: {
      resource: "subjects",
      action: "create",
    },
    defaultValues: {
      name: "",
      code: "",
      description: "",
      cloudinaryImageUrl: null,
      imageCldPubId: null,
    },
  });

  const {
    refineCore: { onFinish },
    handleSubmit,
    formState: { isSubmitting },
    control,
    getValues,
    setValue,
  } = form;

  const onSubmit: SubmitHandler<CreateSubjectValues> = async (values) => {
    await onFinish({
      name: values.name.trim(),
      code: values.code.trim().toUpperCase(),
      description: values.description.trim(),
      cloudinaryImageUrl: values.cloudinaryImageUrl ?? null,
      imageCldPubId: values.imageCldPubId ?? null,
    });
  };

  return (
    <CreateView className="class-view">
      <Breadcrumb />

      <h1 className="page-title">Create Subject</h1>

      <div className="intro-row">
        <p>Add a subject and optionally attach an image.</p>
        <Button onClick={back} className="cursor-pointer" type="button">
          Go Back
        </Button>
      </div>

      <Separator />

      <div className="my-4 flex items-center">
        <Card className="class-form-card w-full">
          <CardHeader className="relative z-10">
            <CardTitle className="text-2xl pb-0 font-bold">
              Subject details
            </CardTitle>
          </CardHeader>

          <Separator />

          <CardContent className="mt-7">
            <Form {...form}>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Subject Name <span className="text-orange-600">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Mathematics"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField
                    control={control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject Code</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="MATH"
                            value={field.value ?? ""}
                            onChange={(event) =>
                              field.onChange(event.target.value.toUpperCase())
                            }
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Optional description"
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={control}
                  name="cloudinaryImageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject Image</FormLabel>
                      <FormControl>
                        <UploadWidget
                          value={
                            field.value
                              ? {
                                  url: field.value,
                                  publicId: getValues("imageCldPubId") ?? "",
                                }
                              : null
                          }
                          onChange={(value) => {
                            field.onChange(value?.url ?? null);
                            setValue("imageCldPubId", value?.publicId ?? null, {
                              shouldDirty: true,
                              shouldValidate: true,
                            });
                          }}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                <Button
                  type="submit"
                  size="lg"
                  className="w-full cursor-pointer"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="flex gap-1 items-center">
                      <span>Creating Subject...</span>
                      <Loader2 className="inline-block ml-2 animate-spin" />
                    </div>
                  ) : (
                    "Create Subject"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </CreateView>
  );
};

export default CreateSubject;
