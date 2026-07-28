"use client";

import { useState, useTransition } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { reorderDashboardWidgets } from "@/app/actions";
import type { WidgetKey } from "@/lib/strands";

function SortableWidget({ id, children }: { id: WidgetKey; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <button
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
        className="absolute -top-2 right-2 z-10 cursor-grab touch-none rounded-md border border-hairline bg-surface px-1.5 py-0.5 text-xs text-paper-faint transition-colors hover:text-paper active:cursor-grabbing"
      >
        ⠿
      </button>
      {children}
    </div>
  );
}

export function DashboardWidgetGrid({
  initialOrder,
  widgets,
}: {
  initialOrder: WidgetKey[];
  widgets: Record<WidgetKey, React.ReactNode>;
}) {
  const [order, setOrder] = useState<WidgetKey[]>(initialOrder);
  const [, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setOrder((current) => {
      const oldIndex = current.indexOf(active.id as WidgetKey);
      const newIndex = current.indexOf(over.id as WidgetKey);
      const next = arrayMove(current, oldIndex, newIndex);
      startTransition(() => {
        reorderDashboardWidgets(next);
      });
      return next;
    });
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={order} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {order.map((key) => (
            <SortableWidget key={key} id={key}>
              {widgets[key]}
            </SortableWidget>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
