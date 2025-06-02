// types.ts
export type FormElementType =
  | "text"
  | "number"
  | "dropdown"
  | "checkbox"
  | "radio"
  | "paragraph"
  | "button";

export type FormElementBase = {
  id: string;
  type: FormElementType;
  label: string;
  required?: boolean;
  placeholder?: string;
  value?: string;
};

export type TextFormElement = FormElementBase & {
  type: "text" | "number";
};

export type DropdownFormElement = FormElementBase & {
  type: "dropdown";
  options: string[];
};

export type CheckboxFormElement = FormElementBase & {
  type: "checkbox";
  checked?: boolean;
};

export type RadioFormElement = FormElementBase & {
  type: "radio";
  options: string[];
};

export type ParagraphFormElement = FormElementBase & {
  type: "paragraph";
};

export type ButtonFormElement = FormElementBase & {
  type: "button";
  buttonText?: string;
};

export type FormElement = 
  | TextFormElement
  | DropdownFormElement
  | CheckboxFormElement
  | RadioFormElement
  | ParagraphFormElement
  | ButtonFormElement;

export type FormSolutionData = {
  description?: string;
  elements: FormElement[];
};

export type Solution = {
  id: string;
  session_id: string;
  category_id: number | null;
  form_data?: FormSolutionData;
  emailContent?: string;
  emailTarget?: string;
  link_url?: string;
  videoFile?: File | null;
  videoUrl?: string;
};

// components/form-builder.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, GripVertical, X } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
// import { FormElement, FormElementType, FormSolutionData } from "@/lib/types";


const DEFAULT_ELEMENT_PROPS: any = {
  text: { label: "Input Field", value: "" },
  number: { label: "Number Field", value: "" },
  dropdown: { label: "Dropdown", options: ["Option 1", "Option 2"], value: "Option 1" },
  // checkbox: { label: "Checkbox", value: "" },
  // radio: { label: "Radio", options: ["Option 1", "Option 2"], value: "Option 1" },
  paragraph: { label: "Paragraph text", value: "" },
  // button: { label: "Button", buttonText: "Submit" },
};

const DEFAULT_FORM_DATA: FormSolutionData = {
  elements: [
    {
      id: `elem-${Date.now()}`,
      type: "text",
      label: "Name",
      value: "",
    },
  ],
};

interface FormBuilderProps {
  form_data?: FormSolutionData;
  onChange?: (newData: FormSolutionData) => void;
  editable?: boolean;
}

export function FormBuilder({
  form_data = DEFAULT_FORM_DATA,
  onChange,
  editable = true,
}: FormBuilderProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  const addElement = (type: FormElementType) => {
    if (!editable || !onChange) return;

    const newElement = {
      id: `elem-${Date.now()}`,
      type,
      ...DEFAULT_ELEMENT_PROPS[type],
    } as FormElement;

    onChange({
      ...form_data,
      elements: [...form_data.elements, newElement],
    });
  };

  const updateElement = (id: string, updates: Partial<FormElement>) => {
    if (!editable || !onChange) return;

    onChange({
      ...form_data,
      elements: form_data.elements.map((el) =>
        el.id === id ? { ...el, ...updates } : el
      ) as any,
    });
  };

  const removeElement = (id: string) => {
    if (!editable || !onChange) return;

    onChange({
      ...form_data,
      elements: form_data.elements.filter((el) => el.id !== id),
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (!editable || !onChange) return;

    const { active, over } = event;
    if (!over || active.id === over.id) {
      setActiveId(null);
      return;
    }

    const oldIndex = form_data.elements.findIndex(
      (el) => el.id === active.id
    );
    const newIndex = form_data.elements.findIndex((el) => el.id === over.id);
    
    if (oldIndex !== -1 && newIndex !== -1) {
      onChange({
        ...form_data,
        elements: arrayMove(form_data.elements, oldIndex, newIndex),
      });
    }
    setActiveId(null);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  return (
    <div className="space-y-6">
      {editable && (
        <div className="flex flex-wrap gap-2 mb-6">
          {Object.keys(DEFAULT_ELEMENT_PROPS).map((type) => (
            <Button
              key={type}
              type="button"
              size="sm"
              onClick={() => addElement(type as FormElementType)}
            >
              <Plus className="h-4 w-4 mr-2" />{" "}
              {DEFAULT_ELEMENT_PROPS[type as FormElementType].label}
            </Button>
          ))}
        </div>
      )}

      {editable ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={form_data.elements.map((el) => el.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-6">
              {form_data.elements.map((element) => (
                <SortableFormElement
                  key={element.id}
                  element={element}
                  onUpdate={(updates) => updateElement(element.id, updates)}
                  onRemove={() => removeElement(element.id)}
                  editable={editable}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="space-y-6">
          {form_data.elements.map((element) => (
            <ReadonlyFormElement key={element.id} element={element} />
          ))}
        </div>
      )}
    </div>
  );
}

interface SortableFormElementProps {
  element: FormElement;
  onUpdate: (updates: Partial<FormElement>) => void;
  onRemove: () => void;
  editable: boolean;
}

function SortableFormElement({
  element,
  onUpdate,
  onRemove,
  editable,
}: SortableFormElementProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: element.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="border rounded-lg p-6 bg-white space-y-4"
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          {editable && (
            <button {...attributes} {...listeners}>
              <GripVertical className="h-4 w-4 text-gray-400 cursor-grab" />
            </button>
          )}
          <span className="text-sm font-medium capitalize">{element.type}</span>
        </div>
        {editable && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="text-red-600 hover:text-red-800 h-8 w-8 p-0"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {editable ? (
          <>
            <div className="space-y-2">
              <Label>Label</Label>
              <Input
                value={element.label}
                onChange={(e) => onUpdate({ label: e.target.value })}
                placeholder="Field label"
              />
            </div>

            {element.type !== "paragraph" && element.type !== "button" && (
              <div className="space-y-2">
                <Label>Value</Label>
                {element.type === "dropdown" || element.type === "radio" ? (
                  <select
                    className="w-full p-2 border rounded"
                    value={element.value}
                    onChange={(e) => onUpdate({ value: e.target.value })}
                  >
                    {element.options?.map((option, index) => (
                      <option key={index} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    value={element.value || ""}
                    onChange={(e) => onUpdate({ value: e.target.value })}
                    placeholder="Field value"
                    type={element.type === "number" ? "number" : "text"}
                  />
                )}
              </div>
            )}

            {(element.type === "dropdown" || element.type === "radio") && (
              <FieldOptions
                options={element.options || []}
                onChange={(options) => onUpdate({ options })}
                editable={editable}
              />
            )}

            {element.type === "paragraph" && (
              <div className="space-y-2">
                <Label>Content</Label>
                <textarea
                  className="w-full p-2 border rounded"
                  rows={3}
                  value={element.label}
                  onChange={(e) => onUpdate({ label: e.target.value })}
                  placeholder="Paragraph content"
                />
              </div>
            )}

            {element.type === "button" && (
              <div className="space-y-2">
                <Label>Button Text</Label>
                <Input
                  value={element.buttonText || ""}
                  onChange={(e) => onUpdate({ buttonText: e.target.value })}
                  placeholder="Button text"
                />
              </div>
            )}
          </>
        ) : (
          <ReadonlyFormElementContent element={element} />
        )}
      </div>
    </div>
  );
}

interface ReadonlyFormElementProps {
  element: FormElement;
}

function ReadonlyFormElement({ element }: ReadonlyFormElementProps) {
  return (
    <div className="border rounded-lg p-6 bg-white space-y-4">
      <div className="space-y-2">
        <Label className="text-sm font-medium">{element.label}</Label>
        <ReadonlyFormElementContent element={element} />
      </div>
    </div>
  );
}

function ReadonlyFormElementContent({ element }: ReadonlyFormElementProps) {
  switch (element.type) {
    case "paragraph":
      return <p className="whitespace-pre-line">{element.label}</p>;
    case "dropdown":
    case "radio":
      return (
        <select
          className="w-full p-2 border rounded"
          value={element.value}
          disabled
        >
          {element.options?.map((option, index) => (
            <option key={index} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    case "checkbox":
      return (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={element.checked}
            disabled
            className="h-4 w-4"
          />
          <span>{element.label}</span>
        </div>
      );
    case "button":
      return (
        <Button disabled>
          {element.buttonText || "Submit"}
        </Button>
      );
    default:
      return (
        <Input
          type={element.type === "number" ? "number" : "text"}
          value={element.value || ""}
          readOnly
          className="w-full"
        />
      );
  }
}

interface FieldOptionsProps {
  options: string[];
  onChange: (options: string[]) => void;
  editable: boolean;
}

function FieldOptions({
  options,
  onChange,
  editable,
}: FieldOptionsProps) {
  const addOption = () => {
    onChange([...options, `Option ${options.length + 1}`]);
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    onChange(newOptions);
  };

  const removeOption = (index: number) => {
    const newOptions = options.filter((_, i) => i !== index);
    onChange(newOptions);
  };

  if (!editable) {
    return null;
  }

  return (
    <div className="space-y-2">
      <Label>Options</Label>
      <div className="space-y-2">
        {options.map((option, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input
              value={option}
              onChange={(e) => updateOption(index, e.target.value)}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeOption(index)}
              className="text-red-600 hover:text-red-800 h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      <Button 
        type="button" 
        variant="outline" 
        size="sm" 
        onClick={addOption}
        className="mt-2"
      >
        <Plus className="h-4 w-4 mr-2" /> Add Option
      </Button>
    </div>
  );
}