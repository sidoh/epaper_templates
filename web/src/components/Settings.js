import React from 'react';
import {Tabs, Tab} from 'react-bootstrap';

class WebSettings extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isGoing: true,
      numberOfGuests: 2
    };

    this.handleInputChange = this.handleInputChange.bind(this);
  }

  handleInputChange(event) {
    const target = event.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;

    this.setState({
      [name]: value
    });
  }

  render() {
    return (
      <form>
        <label>
          Is going:
          <input
            name="isGoing"
            type="checkbox"
            checked={this.state.isGoing}
            onChange={this.handleInputChange} />
        </label>
        <br />
        <label>
          Number of guests:
          <input
            name="numberOfGuests"
            type="number"
            value={this.state.numberOfGuests}
            onChange={this.handleInputChange} />
        </label>
      </form>
    );
  }
}

const Settings = () => (
  <Tabs defaultActiveKey={2} id="uncontrolled-tab-example">
    <Tab eventKey={1} title="Tab 1">
      <WebSettings />
    </Tab>
    <Tab eventKey={2} title="Tab 2">
      Tab 2 content
    </Tab>
    <Tab eventKey={3} title="Tab 3" disabled>
      Tab 3 content
    </Tab>
  </Tabs>
);

export default Settings;