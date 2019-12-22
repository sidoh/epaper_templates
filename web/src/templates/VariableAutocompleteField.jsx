import React, { useEffect, useCallback } from "react";
import Form from "react-bootstrap/Form";
import { Typeahead } from "react-bootstrap-typeahead";
import useGlobalState from "../state/global_state";

export const VariableAutocompleteField = ({
  onChange,
  schema,
  idSchema,
  formData
}) => {
  const [globalState, globalActions] = useGlobalState();

  useEffect(() => {
    globalActions.loadVariables();
  }, []);

  const _onChange = useCallback(
    e => {
      const [first] = e;

      if (first) {
        if (typeof first === "string") {
          onChange(first);
        } else {
          onChange(first.label)
        }
      }
    },
    [onChange]
  );

  const _onInputChange = useCallback(v => onChange(v), [onChange])

  const selected = formData ? [formData] : [];

  return (
    <Form.Group>
      <Form.Label>{schema.title}</Form.Label>
      <Typeahead
        id={idSchema.$id}
        onChange={_onChange}
        onInputChange={_onInputChange}
        options={Object.keys(globalState.variables)}
        selected={selected}
        allowNew={true}
      />
    </Form.Group>
  );
};
