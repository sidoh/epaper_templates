import React, { useEffect, useCallback } from 'react';
import Form from 'react-bootstrap/Form';
import { Typeahead } from "react-bootstrap-typeahead";
import useGlobalState from '../state/global_state';

export const VariableAutocompleteField = ({ onChange, schema, idSchema, formData }) => {
  const [globalState, globalActions] = useGlobalState();

  useEffect(() => {
    globalActions.loadVariables();
  }, [])

  const _onChange = useCallback((e) => {
    const [first] = e;

    if (first) {
      onChange(first);
    }
  }, [onChange])

  return (
    <Form.Group>
      <Form.Label>{schema.title}</Form.Label>
      <Typeahead
      id={idSchema.$id}
        onChange={_onChange}
        options={Object.keys(globalState.variables)}
        selected={[formData]}
        allowNew={true}
        />
    </Form.Group>
  )
}