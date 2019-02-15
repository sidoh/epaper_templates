import React from 'react'
import { connect } from 'react-redux'
import { 
  Button, 
  Glyphicon, 
  FormGroup,
  ControlLabel,
  FormControl,
  Alert
} from 'react-bootstrap'
import brace from 'brace';
import AceEditor from 'react-ace';
import { withAlert } from 'react-alert'

import 'brace/mode/json';
import 'brace/theme/solarized_dark';

import { loadTemplate, saveTemplate, loadTemplates } from '../../actions'
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
          this.props.loadTemplates().then(() => {
            this.props.loadTemplate(`${name}.json`).then(() => {
              window.location.hash = `/templates/${name}.json`;
            });
          });
        } else {
          this.props.loadTemplates();
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
    var isNewAlert = '';

    if (this.props.isNew) {
      isNewAlert = <Alert bsStyle="success">Creating new template</Alert>;
    }

    return (
      <div>
      {isNewAlert}
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
      </div>
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
      var contents = this.props.templateContents[this.templateFilename()];

      try {
        contents = JSON.stringify(JSON.parse(contents), null, 2);
      } catch (err) {
        // Error is handled by action
      }

      return contents;
    }

    return '';
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

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (!this.templateContents() && prevProps.templateContents && prevProps.templateContents[this.templateFilename()]) {
      window.location.hash = '/templates';
    }
  }

  render() {
    return (
      <div className="row">
        <div className="col-md-3">
          <TemplateList disableActive={this.isNew()} />
        </div>
        <div className="col-md-9">
          <Template 
            name={this.templateName()}
            contents={this.templateContents()}
            onSave={this.props.saveTemplate}
            loadTemplates={this.props.loadTemplates}
            loadTemplate={this.props.loadTemplate}
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
      return dispatch(loadTemplate(template));
    },
    saveTemplate: (name, contents) => {
      return dispatch(saveTemplate(name, contents));
    },
    loadTemplates: () => { 
      return dispatch(loadTemplates());
    }
  })
)(withAlert(ShowTemplate));