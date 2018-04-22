import React from 'react';
import { connect } from 'react-redux';
import Loadable from 'react-loading-overlay';
import { Link } from 'react-router-dom'
import { Button, Glyphicon } from 'react-bootstrap'

import { loadTemplate, loadTemplates, deleteTemplate } from '../../actions';

const TemplateListItem = ({template, onClick, onDelete}) => (
  <li className="list-group-item">
    <div className="row">
      <div className="col-sm-10">
        <Link to={`/templates/${template.filename}`} onClick={onClick}>{template.name}</Link>
      </div>
      <div className="col-sm-2">
        <Link to={`/templates/${template.filename}`} onClick={onDelete} className="delete">
          <Glyphicon glyph="trash"/>
        </Link>
      </div>
    </div>
  </li>
)

class TemplateList extends React.Component {
  componentDidMount() {
    this.props.onLoad();
  }

  render() {
    return (
      // <Loadable active={this.props.isLoading} spinner text='Loading templates'>
      <div>
        <div className="pull-left">
          <h3>Templates</h3>
        </div>
        <div className="pull-right">
          <Button 
            bsSize="small" 
            bsStyle="success" 
            style={{marginTop: '1em'}}
            href="/#/templates/_/new"
           >
            <Glyphicon glyph="plus" />
          </Button>
        </div>
        <div className="clearfix"></div>
        <ul className="list-group template-list">
          {this.props.templates.map(
            template => (
              <TemplateListItem 
                template={template} 
                onClick={() => {this.props.loadTemplate(template.filename)}} 
                onDelete={(e) => {e.preventDefault(); this.props.deleteTemplate(template.filename)}} 
              />
            )
          )}
        </ul>
      </div>
      // </Loadable>
    )
  }
};

export default connect(
  (state) => ({
    isLoading: (state.loadingStatus || {}).isLoading,
    templates: (state.templates.templates || []),
    selectedTemplate: state.templates.selectedTemplate
  }),
  (dispatch) => ({
    onLoad: () => { dispatch(loadTemplates()); },
    loadTemplate: (templateName) => { dispatch(loadTemplate(templateName)); },
    deleteTemplate: (templateName) => { dispatch(deleteTemplate(templateName)); }
  })
)(TemplateList);