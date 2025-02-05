import React, { useEffect, useState, useContext } from 'react';
import {
  Row,
  Col,
  Spinner,
} from "react-bootstrap";
import {
  Switch,
  Route,
  BrowserRouter
} from "react-router-dom";
import { CSSTransition } from "react-transition-group";
import { library } from '@fortawesome/fontawesome-svg-core';
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStripe, faGithub } from '@fortawesome/free-brands-svg-icons';
import {
  faAngleDown,
  faArrowDown,
  faArrowsAltH,
  faArrowUp,
  faBalanceScale,
  faBolt,
  faBug,
  faBullseye,
  faCalendarDay,
  faCalendarCheck,
  faCaretDown,
  faCertificate,
  faChalkboardTeacher,
  faCheckCircle,
  faChevronLeft,
  faChevronRight,
  faCircle,
  faClock,
  faCode,
  faCog,
  faComment,
  faCopy,
  faCopyright,
  faEnvelope,
  faEnvelopeOpen,
  faExclamationCircle,
  faExclamationTriangle,
  faEye,
  faEyeSlash,
  faFilePdf,
  faFilter,
  faFlag,
  faFont,
  faGraduationCap,
  faGlobeAmericas,
  faHandHoldingHeart,
  faHardHat,
  faHistory,
  faHome,
  faHourglassHalf,
  faInfoCircle,
  faKey,
  faKeyboard,
  faLaptop,
  faLaughBeam,
  faLeaf,
  faLightbulb,
  faLink,
  faLock,
  faLongArrowAltRight,
  faMobile,
  faMap,
  faPaperPlane,
  faPencilAlt,
  faPlus,
  faPrint,
  faQuestionCircle,
  faRedoAlt,
  faReply,
  faSave,
  faSearch,
  faSeedling,
  faShoePrints,
  faShoppingCart,
  faSignInAlt,
  faSignOutAlt,
  faSlidersH,
  faSort,
  faSortUp,
  faSortDown,
  faSortAlphaDown,
  faSpinner,
  faThumbsUp,
  faThumbtack,
  faTimesCircle,
  faTrashAlt,
  faUndoAlt,
  faUser,
  faUserCircle,
  faUserGraduate,
  faUserLock,
  faUserPlus,
  faUsers,
  faVideo,
  faWalking,
  faWind,
  faWrench,
} from '@fortawesome/free-solid-svg-icons';

import './Main.scss';

import { urlBase, DEBUGGING } from "../variables";
import PrivateRoute from "../Components/PrivateRoute";
import TopNavbar from "../Components/TopNavbar";
import Tools from "../Components/Tools";
import Home from "./Home";
import Login from "./Login";
import Register from "./Register";
import Walk from "./Walk";
import Profile from "./Profile";
import Videos from "./Videos";
import Info from "./Info";
import Admin from "./Admin";
import Instructors from "./Instructors";
import JoinCourse from "./JoinCourse";
import UserProvider, { UserContext } from "../UserContext/UserProvider";
import { checkLogin } from '../Services/authService';
import ResetPassword from './ResetPassword';
import ContactForm from '../Components/ContactForm';

library.add(
  faAngleDown,
  faArrowsAltH,
  faArrowUp,
  faArrowDown,
  faBalanceScale,
  faBolt,
  faBug,
  faBullseye,
  faCalendarCheck,
  faCalendarDay,
  faCaretDown,
  faCertificate,
  faChalkboardTeacher,
  faCheckCircle,
  faChevronLeft,
  faChevronRight,
  faCircle,
  faClock,
  faCode,
  faCog,
  faComment,
  faCopy,
  faCopyright,
  faEnvelope,
  faEnvelopeOpen,
  faExclamationCircle,
  faExclamationTriangle,
  faEye,
  faEyeSlash,
  faFilePdf,
  faFilter,
  faFlag,
  faFont,
  faGithub,
  faGlobeAmericas,
  faGraduationCap,
  faHandHoldingHeart,
  faHardHat,
  faHistory,
  faHome,
  faHourglassHalf,
  faInfoCircle,
  faKey,
  faKeyboard,
  faLaptop,
  faLaughBeam,
  faLeaf,
  faLightbulb,
  faLink,
  faLock,
  faLongArrowAltRight,
  faMap,
  faMobile,
  faPaperPlane,
  faPencilAlt,
  faPlus,
  faPrint,
  faQuestionCircle,
  faRedoAlt,
  faReply,
  faShoePrints,
  faSave,
  faSearch,
  faSeedling,
  faShoePrints,
  faShoppingCart,
  faSignInAlt,
  faSignOutAlt,
  faSlidersH,
  faSort,
  faSortAlphaDown,
  faSortUp,
  faSortDown,
  faSpinner,
  faStripe,
  faTrashAlt,
  faThumbsUp,
  faThumbtack,
  faTimesCircle,
  faUndoAlt,
  faUser,
  faUserCircle,
  faUserGraduate,
  faUserLock,
  faUserPlus,
  faUsers,
  faVideo,
  faWalking,
  faWind,
  faWrench,
);


const myroutes = [
  {path: "/" + urlBase + "(/static/react-source/dist/index.html||/home||/)", exact: true, Component: Home},
  {path: "/" + urlBase + "/videos/:lessonParam?", exact: false,
    Component: Videos},
  {path: "/" + urlBase + "/info/:infoPage", exact: false, Component: Info},
  {path: "/" + urlBase + "/contact", exact: false, Component: ContactForm},
  {path: "/" + urlBase + "/login", exact: false, Component: Login},
  {path: "/" + urlBase + "/register", exact: false, Component: Register},
  {path: "/" + urlBase + "/reset_password", exact: false,
    Component: ResetPassword},
  {path: "/" + urlBase + "/join_course:courseKey?", exact: false,
    Component: JoinCourse},
  {path: "/" + urlBase + "", exact: false, Component: Home}
]

const myPrivateRoutes = [
  {path: "/" + urlBase + "/walk/:walkPage/:walkStep?", exact: false,
    Component: Walk},
  {path: "/" + urlBase + "/profile/:userId?", exact: false, Component: Profile},
  {path: "/" + urlBase + "/admin/:adminPage", exact: false, Component: Admin},
  {path: "/" + urlBase + "/instructors/:instrPage", exact: false, Component: Instructors},
]

const MainPage = ({props}) => {
  const [ myheight, setMyheight ] = useState(null);
  const { user, dispatch } = useContext(UserContext);

  const setHeight = () => {
    const headroom = document.querySelector('.navbar').offsetHeight;
    let divHeight = window.innerHeight - headroom;
    setMyheight(divHeight);
    DEBUGGING && console.log(`set height to ${divHeight} with headroom of ${headroom}`);
  }

  useEffect(() => {
    // setHeight();
  }, []);

  useEffect(() => {
    // console.log('=================================');
    // console.log('Checking login in Main');
    checkLogin(user, dispatch);
  }, []);

  return (
    <Col className="content"
      style={{height: myheight}}
    >
      <Switch>
      {myPrivateRoutes.map(({ path, exact, Component }) => (
        <PrivateRoute key={path} exact={exact} path={path} >
          {( { match } ) => (
          <CSSTransition
            classNames="content-view"
            key={path}
            in={match != null}
            appear={true}
            timeout={300}
            unmountOnExit
          >
            <React.Fragment>
              <Component />
              <Tools />
            </React.Fragment>
          </CSSTransition>
          )}
        </PrivateRoute>
      )
      )}
      {myroutes.map(({ path, exact, Component }) => (
        <Route key={path} exact={exact} path={path}>
          {( { match } ) => (
            <CSSTransition
              classNames="content-view"
              key={path}
              in={match != null}
              appear={true}
              timeout={300}
              unmountOnExit
            >
              <React.Fragment>
                <Component />
                <Tools />
              </React.Fragment>
            </CSSTransition>
          )}
        </Route>
      )
      )}
      </Switch>
    </Col>
  )
}


const Main = () => {

  const [ pageLoaded , setPageLoaded ] = useState(false);

  useEffect(() => {
    const onPageLoad = () => {
      setPageLoaded(true);
    };

    // Check if the page has already loaded
    if (document.readyState === "complete") {
      onPageLoad();
    } else {
      window.addEventListener("load", onPageLoad);
      // Remove the event listener when component unmounts
      return () => window.removeEventListener("load", onPageLoad);
    }
  }, []);

  return (
    <UserProvider>
    <BrowserRouter>
      <React.Fragment>
        <TopNavbar routes={myroutes} pageLoaded={pageLoaded} />
        <Row className={`Main ${!!pageLoaded ? "page-loaded" : ""}`}>
          <MainPage />
        </Row>
    </React.Fragment>
    </BrowserRouter>
    </UserProvider>
  );
}

export default Main;
