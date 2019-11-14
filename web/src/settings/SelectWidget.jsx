import React, { useMemo, useCallback } from "react";
import Form from "react-bootstrap/Form";

export function SelectWidget({ value, onChange, label, schema }) {
  const options = useMemo(
    () => schema.enum.map(x => ({ label: x, value: x })),
    [schema]
  );
  const _onChange = useCallback(e => onChange(parseInt(e.target.value)), onChange);

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
