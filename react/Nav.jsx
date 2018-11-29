import React from 'react';

const Nav = ( { label, children } ) => {
	return (
		<nav aria-label={label}>
			<ul>
				{
					React.Children.map( children, ( child ) => {
						return <li>{child}</li>;
					} )
				}
			</ul>
		</nav>
	);
}

export default Nav;
