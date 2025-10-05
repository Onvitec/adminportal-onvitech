// components/enhanced-form-builder.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, GripVertical } from "lucide-react";

export type FormElementType =
  | "text"
  | "email"
  | "number"
  | "textarea"
  | "dropdown"
  | "checkbox"
  | "radio";

export type FormOption = {
  id: string;
  label: string;
};

export type FormElement = {
  id: string;
  type: FormElementType;
  label: string;
  placeholder?: string;
  options?: FormOption[];
};

export type FormSolutionData = {
  title?: string;
  elements: FormElement[];
  email?:string;
};

interface EnhancedFormBuilderProps {
  formData: FormSolutionData;
  onChange: (data: FormSolutionData) => void;
}

const DEFAULT_FORM: FormSolutionData = {
  title: "",
  elements: [
    {
      id: `elem-${Date.now()}`,
      type: "text",
      label: "Name",
      placeholder: "Enter your name",
    },
    {
      id: `elem-${Date.now() + 1}`,
      type: "email",
      label: "Email",
      placeholder: "Enter your email",
    },
  ],
};

export function EnhancedFormBuilder({
  formData = DEFAULT_FORM,
  onChange,
}: EnhancedFormBuilderProps) {
  const addElement = (type: FormElementType) => {
    const label =
      type === "textarea"
        ? "Text Area"
        : type.charAt(0).toUpperCase() + type.slice(1);

    const placeholder =
      type === "textarea" ? "Enter your text here" : `Enter your ${type}`;

    const newElement: FormElement = {
      id: `elem-${Date.now()}`,
      type,
      label,
      placeholder,
    };

    if (type === "dropdown" || type === "checkbox" || type === "radio") {
      newElement.options = [
        { id: `opt-${Date.now()}-1`, label: "Option 1" },
        { id: `opt-${Date.now()}-2`, label: "Option 2" },
      ];
    }

    onChange({
      ...formData,
      elements: [...formData.elements, newElement],
    });
  };

  const updateElement = (id: string, updates: Partial<FormElement>) => {
    onChange({
      ...formData,
      elements: formData.elements.map((el) =>
        el.id === id ? { ...el, ...updates } : el
      ),
    });
  };

  const removeElement = (id: string) => {
    onChange({
      ...formData,
      elements: formData.elements.filter((el) => el.id !== id),
    });
  };

  const updateTitle = (title: string) => {
    onChange({
      ...formData,
      title,
    });
  };

  const addOption = (elementId: string) => {
    const element = formData.elements.find((el) => el.id === elementId);
    if (element && element.options) {
      const newOptions = [
        ...element.options,
        {
          id: `opt-${Date.now()}`,
          label: `Option ${element.options.length + 1}`,
        },
      ];
      updateElement(elementId, { options: newOptions });
    }
  };

  const updateOption = (elementId: string, optionId: string, label: string) => {
    const element = formData.elements.find((el) => el.id === elementId);
    if (element && element.options) {
      const newOptions = element.options.map((opt) =>
        opt.id === optionId ? { ...opt, label } : opt
      );
      updateElement(elementId, { options: newOptions });
    }
  };

  const removeOption = (elementId: string, optionId: string) => {
    const element = formData.elements.find((el) => el.id === elementId);
    if (element && element.options) {
      const newOptions = element.options.filter((opt) => opt.id !== optionId);
      updateElement(elementId, { options: newOptions });
    }
  };

  return (
    <div className="space-y-4">
      {/* <div>
        <Label htmlFor="form-title">Form Title</Label>
        <Input
          id="form-title"
          value={formData.title || ""}
          onChange={(e) => updateTitle(e.target.value)}
          placeholder="Enter form title"
        />
      </div> */}

      <div className="flex flex-wrap gap-2 mb-4">
        <Button type="button" size="sm" onClick={() => addElement("text")}>
          <Plus className="h-4 w-4 mr-2" /> Text Field
        </Button>
        <Button type="button" size="sm" onClick={() => addElement("email")}>
          <Plus className="h-4 w-4 mr-2" /> Email Field
        </Button>
        <Button type="button" size="sm" onClick={() => addElement("number")}>
          <Plus className="h-4 w-4 mr-2" /> Number Field
        </Button>
        <Button type="button" size="sm" onClick={() => addElement("textarea")}>
          <Plus className="h-4 w-4 mr-2" /> Text Area
        </Button>
        <Button type="button" size="sm" onClick={() => addElement("dropdown")}>
          <Plus className="h-4 w-4 mr-2" /> Dropdown
        </Button>
        <Button type="button" size="sm" onClick={() => addElement("checkbox")}>
          <Plus className="h-4 w-4 mr-2" /> Checkbox Group
        </Button>
        <Button type="button" size="sm" onClick={() => addElement("radio")}>
          <Plus className="h-4 w-4 mr-2" /> Radio Group
        </Button>
      </div>

      <div className="space-y-4">
        {formData.elements.map((element) => (
          <div
            key={element.id}
            className="border rounded-lg p-4 bg-gray-50 space-y-3"
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <GripVertical className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-medium">
                  {element.type === "checkbox"
                    ? "Checkbox Group"
                    : element.type === "radio"
                    ? "Radio Group"
                    : element.type === "textarea"
                    ? "Text Area"
                    : element.type.charAt(0).toUpperCase() +
                      element.type.slice(1)}
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeElement(element.id)}
                className="text-red-600 hover:text-red-800 h-8 w-8 p-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Question / Field Label</Label>
              <Input
                value={element.label}
                onChange={(e) =>
                  updateElement(element.id, { label: e.target.value })
                }
                placeholder="Enter your question or field label"
              />
            </div>

            {element.type !== "checkbox" &&
              element.type !== "radio" &&
              element.type !== "dropdown" && (
                <div className="space-y-2">
                  <Label>Placeholder Text</Label>
                  <Input
                    value={element.placeholder || ""}
                    onChange={(e) =>
                      updateElement(element.id, { placeholder: e.target.value })
                    }
                    placeholder="Placeholder text"
                  />
                </div>
              )}

            {(element.type === "dropdown" ||
              element.type === "checkbox" ||
              element.type === "radio") && (
              <div className="space-y-2">
                <Label>
                  {element.type === "dropdown"
                    ? "Dropdown Options"
                    : element.type === "checkbox"
                    ? "Checkbox Options"
                    : "Radio Options"}
                </Label>
                <div className="space-y-2">
                  {element.options?.map((option) => (
                    <div key={option.id} className="flex items-center gap-2">
                      <Input
                        value={option.label}
                        onChange={(e) =>
                          updateOption(element.id, option.id, e.target.value)
                        }
                        placeholder="Option label"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeOption(element.id, option.id)}
                        className="text-red-600 hover:text-red-800 h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addOption(element.id)}
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Option
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="p-4 border border-dashed border-green-400 rounded-lg bg-green-50">
        <p className="text-sm text-green-700 font-medium">
          ✓ Submit button will be automatically added to the form
        </p>
      </div>
    </div>
  );
}
