import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { HashRouter, Link, Route, Switch, withRouter } from 'react-router-dom';

import Nav from './Nav.jsx';
import EditorTypes from './EditorTypes.jsx';
import ConfigEvents from './ConfigEvents.jsx';
import TwoWayBinding from './TwoWayBinding.jsx';

class Samples extends Component {
	render() {
		return (
			<HashRouter>
				<SamplesContainer>
					<Nav label="React integration samples">
						<Link to="/">Editor Types</Link>
						<Link to="/events">Config &amp; Events</Link>
						<Link to="/2-way-binding">2-way Binding</Link>
					</Nav>
					<Switch>
						<Route exact path="/" component={EditorTypes} />
						<Route path="/events" component={ConfigEvents} />
						<Route path="/2-way-binding" component={TwoWayBinding} />
					</Switch>
				</SamplesContainer>
			</HashRouter>
		);
	}
}

const SamplesContainer = withRouter( class extends Component {
	componentDidUpdate() {
		refreshSamples();
	}

	render() {
		return (
			<>
				{this.props.children}
			</>
		);
	}
} );

function refreshSamples() {
	if ( simpleSample ) {
		simpleSample.refreshSamples();
	}
}

ReactDOM.render(
	<Samples />,
	window.document.getElementById( 'app' )
);

