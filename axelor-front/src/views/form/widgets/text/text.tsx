import { useAtom, useAtomValue } from "jotai";
import React, { useCallback, useState } from "react";

import { Input } from "@axelor/ui";

import { FieldControl, FieldProps } from "../../builder";

const noop = () => {};

export function Text({
  inputProps,
  ...props
}: FieldProps<string> & {
  inputProps?: Pick<
    React.InputHTMLAttributes<HTMLTextAreaElement>,
    "onFocus" | "onBlur" | "autoFocus"
  >;
}) {
  const { schema, readonly, widgetAtom, valueAtom } = props;
  const { uid, height, placeholder } = schema;
  const { onBlur } = inputProps || {};

  const { attrs } = useAtomValue(widgetAtom);
  const { required } = attrs;

  const [value, setValue] = useAtom(valueAtom);
  const [changed, setChanged] = useState(false);

  const handleChange = useCallback<
    React.ChangeEventHandler<HTMLTextAreaElement>
  >(
    (e) => {
      setValue(e.target.value);
      setChanged(true);
    },
    [setValue]
  );

  const handleBlur = useCallback<React.FocusEventHandler<HTMLTextAreaElement>>(
    (e) => {
      if (changed) {
        setChanged(false);
        setValue(e.target.value, true);
      }
      onBlur?.(e);
    },
    [changed, setValue, onBlur]
  );

  return (
    <FieldControl {...props}>
      {readonly ? (
        <Input
          data-input
          as="textarea"
          rows={height || 5}
          value={value || ""}
          onChange={noop}
          disabled
          readOnly
          bg="body"
          border={false}
          style={{
            resize: "none",
          }}
        />
      ) : (
        <Input
          data-input
          as="textarea"
          rows={height || 5}
          id={uid}
          placeholder={placeholder}
          value={value || ""}
          required={required}
          {...inputProps}
          onChange={handleChange}
          onBlur={handleBlur}
        />
      )}
    </FieldControl>
  );
}
