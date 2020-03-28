import React, { useMemo, useCallback } from "react";
import Form from "react-bootstrap/Form";

export function SelectWidget({ value, onChange, label, schema }) {
  const options = useMemo(() => {
    if (schema.enum) {
      return schema.enum.map(x => ({ label: x, value: x }));
    } else if (schema.oneOf) {
      return schema.oneOf.map(x => ({ label: x.title, value: x.const }));
    }
  }, [schema]);

  const _onChange = useCallback(e => onChange(e.target.value), [onChange]);

  return (
    <Form.Control as="select" value={value} onChange={_onChange}>
      {options.map(x => (
        <option key={x.value} value={x.value}>
          {x.label}
        </option>
      ))}
    </Form.Control>
  );
}
