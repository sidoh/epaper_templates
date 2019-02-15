import React from 'react'
import { connect } from 'react-redux'
import { Button, Glyphicon } from 'react-bootstrap'

import { loadTemplate } from '../../actions'

import TemplateList from './TemplateList'

const TemplateIndex = () => (
  <div className="row">
    <div className="col-md-3">
      <TemplateList disableActive={true} />
    </div>
  </div>
)

export default TemplateIndex;