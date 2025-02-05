import React, { useState } from "react";
import {
  Collapse,
  Card
} from "react-bootstrap";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faMinus,
  // faNetworkWired
} from '@fortawesome/free-solid-svg-icons';

const Collapsible = ({linkElement="h3",
                      linkIcon,
                      linkText,
                      children,
                      open=false,
                      className="",
                      ...otherProps}) => {
  const [isOpen, setOpen] = useState(open);
  const Tag = linkElement;

  return (
    <Card {...otherProps} className={className} >
      <Card.Body>
        <a onClick={() => setOpen(!isOpen)}
          aria-controls="collapse-pane"
          aria-expanded={isOpen}
        >
          <Tag>
            {!!linkIcon &&
              <FontAwesomeIcon icon={linkIcon} fixedWidth />
            }
            {linkText}
            <FontAwesomeIcon icon={isOpen ? faMinus : faPlus} pull="right" />
          </Tag>
        </a>
        <Collapse in={isOpen}>
          <div id="switching-pane">
            {children}
          </div>
        </Collapse>
      </Card.Body>
    </Card>
  )
}

// class Collapsible extends Component {
//   constructor(props, context) {
//     super(props, context);

//     this.state = {
//       open: false,
//     };
//   }

//   static defaultProps = {
//     linkText: null,
//     linkElement: "h3"
//   }

//   render() {
//     const { open } = this.state;
//     const Tag = this.props.linkElement;
//     return(
//       <Card>
//         <Card.Body>
//           <a onClick={() => this.setState({open: !open})}
//             aria-controls="collapse-pane"
//             aria-expanded={open}
//           >
//             <Tag>
//               {!!this.props.linkIcon &&
//                 <FontAwesomeIcon icon={this.props.linkIcon} fixedWidth />
//               }
//               {this.props.linkText}
//               <FontAwesomeIcon icon={open ? faMinus : faPlus} pull="right" />
//             </Tag>
//           </a>
//           <Collapse in={this.state.open}>
//             <div id="switching-pane">
//               {this.props.children}
//             </div>
//           </Collapse>
//         </Card.Body>
//       </Card>
//     )
//   }
// }

export default Collapsible;
