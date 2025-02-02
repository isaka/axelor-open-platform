import { useAtom, useAtomValue } from "jotai";
import isEqual from "lodash/isEqual";
import { useCallback, useEffect, useMemo, useState } from "react";

import { parseExpression } from "@/hooks/use-parser/utils";
import { Schema, Selection } from "@/services/client/meta.types";

import { FieldProps, WidgetAtom } from "../../builder";
import { useFormScope } from "../../builder/scope";
import { isIntegerField, isReferenceField } from "../../builder/utils";
import convert from "@/utils/convert";

export type SelectItem = {
  id: string;
  selection: Selection;
};

function acceptNumber(value?: unknown) {
  if (value === null || value === undefined) return value;
  if (typeof value === "number") return +value;
  if (typeof value === "string" && /^(-)?\d+(\.\d+)?$/.test(value)) {
    return +value;
  }
  return value;
}

function getSelectionIn(schema: Schema) {
  return schema["selection-in"] || schema.selectionIn;
}

export function useSelectionList({
  value,
  schema,
  widgetAtom,
}: {
  value?: unknown;
  schema: Schema;
  widgetAtom: WidgetAtom;
}) {
  const [filterList, setFilterList] = useState<null | unknown[]>([]);

  const { recordHandler } = useFormScope();
  const { attrs } = useAtomValue(widgetAtom);

  const selectionIn = getSelectionIn(attrs) || getSelectionIn(schema);

  useEffect(() => {
    const { selectionList = [] } = schema;

    if (selectionIn && selectionList?.length > 0) {
      return recordHandler.subscribe((record) => {
        let list = selectionIn ?? null;
        if (typeof selectionIn === "string") {
          let expr = selectionIn.trim();
          if (!expr.startsWith("[")) {
            expr = "[" + expr + "]";
          }
          list = parseExpression(expr)(record);
        }

        if (Array.isArray(list) && list.length > 0) {
          list = list.map(acceptNumber);
        } else {
          list = null;
        }

        setFilterList((prev) => (isEqual(prev, list) ? prev : list));
      });
    }

    setFilterList(null);
  }, [recordHandler, schema, selectionIn]);

  return useMemo(() => {
    const selectionList: Selection[] = schema.selectionList ?? [];
    return filterList
      ? selectionList.filter(
          (item) =>
            (value !== undefined &&
              (Array.isArray(value)
                ? value.some((v) => String(v) === String(item.value))
                : String(value) === String(item.value))) ||
            filterList.some((x) => String(x) === String(item.value)),
        )
      : selectionList;
  }, [schema.selectionList, filterList, value]);
}

export function useSelectionDefault({
  value,
  schema,
}: {
  value: unknown;
  schema: Schema;
}) {
  const selectionZero = useMemo<boolean>(() => {
    return (
      isIntegerField(schema) &&
      String(schema.defaultValue) === "0" &&
      schema.selectionList &&
      schema.selectionList.every((x: Selection) => String(x.value) !== "0")
    );
  }, [schema]);

  const selectionDefault = useMemo(() => {
    if (selectionZero && String(value) === "0") {
      return { value: "0", title: "" };
    }

    return value == null ? value : { title: value, value };
  }, [selectionZero, value]) as Selection;

  return {
    selectionZero,
    selectionDefault,
  };
}

// single selection values only
export function useSelectionValue(
  { valueAtom, schema }: FieldProps<string | number | Record<string, number>>,
  { disabled }: { disabled?: boolean } = {},
) {
  const [value, setValue] = useAtom(valueAtom);
  const handleChange = useCallback(
    ({ selection }: SelectItem) => {
      if (disabled) return;
      if (isReferenceField(schema)) {
        const id = +selection.value!;
        setValue({ id }, true);
      } else {
        setValue(convert(selection.value, { props: schema }), true);
      }
    },
    [schema, disabled, setValue],
  );

  return [value, handleChange] as const;
}
