import React from 'react'
import { connect } from 'react-redux'
import { 
  Button, 
  Glyphicon, 
  FormGroup,
  ControlLabel,
  FormControl
} from 'react-bootstrap'
import brace from 'brace';
import AceEditor from 'react-ace';

import 'brace/mode/json';
import 'brace/theme/solarized_dark';

import { loadTemplate, saveTemplate } from '../../actions'
import TemplateList from './TemplateList'

class Template extends React.Component {
  constructor(props, context) {
    super(props, context);

    this.state = {
      name: (this.props.isNew ? '' : props.name),
      contents: props.contents
    };
  }

  handleNameChange(e) {
    this.setState({
      name: e.target.value
    });
  }

  handleContentsChange(newValue) {
    this.setState({
      contents: newValue
    });
  }

  handleSubmit(e) {
    e.preventDefault();

    const { name, contents } = this.state;
    this.props.onSave(name, contents)
      .then(() => {
        if (this.props.isNew) {
          window.location.hash = `/templates/${name}.json`;
        }
      });
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    const updatedState = {};

    if (nextProps.name != prevState.name && !nextProps.isNew) {
      updatedState.name = nextProps.name;
    } else if (nextProps.name == '_') {
      updatedState.name = '';
    }

    ['contents'].forEach(k => {
      if (nextProps[k] != prevState[k]) {
        updatedState[k] = nextProps[k];
      }
    });

    return updatedState;
  }

  render() {
    return (
      <form onSubmit={this.handleSubmit.bind(this)}>
        <FormGroup>
          <ControlLabel>Name</ControlLabel>
          <FormControl 
            type="text" 
            value={this.state.name}
            disabled={!this.props.isNew}
            onChange={this.handleNameChange.bind(this)}
          />
        </FormGroup>

        <FormGroup>
          <AceEditor
            mode="json"
            theme="solarized_dark"
            width="100%"
            height="40em"
            tabSize={2}
            onChange={this.handleContentsChange.bind(this)}
            value={this.state.contents}
          />
        </FormGroup>

        <FormGroup className="pull-right">
          <Button
            type="submit"
            bsStyle="success"
          >Save</Button>
        </FormGroup>
      </form>
    )
  }
}

class ShowTemplate extends React.Component {
  templateFilename() {
    return this.props.match.params.templateName;
  }

  templateName() {
    return this.templateFilename().replace(/\.json$/, '')
  }

  templateContents() {
    if (this.props.templateContents) {
      return JSON.stringify(this.props.templateContents[this.templateFilename()], null, 2)
    }
    return ''
  }

  isNew() {
    return this.props.match.params.action == 'new';
  }

  componentDidMount() {
    if (! this.isNew()) {
      if (! this.props.templateContents || ! this.props.templateContents[this.templateFilename()]) {
        this.props.loadTemplate(this.templateFilename());
      }
    }
  }

  render() {
    return (
      <div className="row">
        <div className="col-md-3">
          <TemplateList />
        </div>
        <div className="col-md-9">
          <Template 
            name={this.templateName()}
            contents={this.templateContents()}
            onSave={this.props.saveTemplate}
            isNew={this.isNew()}
          />
        </div>
      </div>
    )
  }
}

export default connect(
  (state) => ({
    templateContents: state.templates.templateContents
  }),
  (dispatch) => ({
    loadTemplate: (template) => {
      dispatch(loadTemplate(template));
    },
    saveTemplate: (name, contents) => {
      return dispatch(saveTemplate(name, contents))
    }
  })
)(ShowTemplate);