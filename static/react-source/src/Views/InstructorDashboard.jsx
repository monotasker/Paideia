import "core-js/stable";
import "regenerator-runtime/runtime";
import React, { useState, useEffect, useContext } from "react";
import { useHistory,
         Link,
         useLocation
       } from "react-router-dom";

import {
  Alert,
  Button,
  ButtonGroup,
  Col,
  Collapse,
  Container,
  Form,
  FormGroup,
  InputGroup,
  Modal,
  Row,
  Spinner,
  Tab,
  Table,
  Tabs
} from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import moment from "moment";
import DayPickerInput from "react-day-picker/DayPickerInput";
import { formatDate, parseDate } from "react-day-picker/moment";
import 'react-day-picker/lib/style.css';

import { UserContext } from "../UserContext/UserProvider";
import { doApiCall,
         returnStatusCheck,
         isIntegerString } from "../Services/utilityService";
import { urlBase } from "../variables";
import { sendFormRequest,
         useFormManagement,
       } from "../Services/formsService";

const StudentRow = ({ studentData, classInProcess, history, dispatch,
                      defaults, courseId }) => {
  const [ showStudentDetails, setShowStudentDetails ] = useState(false);
  const [ fetchingStudent, setFetchingStudent ] = useState(false);
  const [ clearingValue, setClearingValue ] = useState(false);
  const [ showPromotionConfirm, setShowPromotionConfirm ] = useState(false);
  const [ showDemotionConfirm, setShowDemotionConfirm ] = useState(false);
  const [ promotingInProgress, setPromotingInProgress ] = useState(false);
  const [ demotingInProgress, setDemotingInProgress ] = useState(false);
  const [ promotionFailed, setPromotionFailed ] = useState("");
  const [ demotionFailed, setDemotionFailed ] = useState("");

  let {uid, first_name, last_name, current_set, starting_set, ending_set,
        final_grade, grade, counts, start_date, end_date, custom_start, custom_end, previous_end_date, progress, custom_a_cap, custom_b_cap, custom_c_cap, custom_d_cap, tp_id} = studentData;

  const fieldsAndValidators = {
    [`starting_set%${uid}`]: ["number", starting_set],
    [`ending_set%${uid}`]: ["number", ending_set],
    [`grade%${uid}`]: ["alphanumeric", grade],
    [`custom_start%${uid}`]: ["date", moment(custom_start).isValid() ? moment(custom_start).toDate() : "Class default"],
    [`custom_end%${uid}`]: ["date", moment(custom_end).isValid() ? moment(custom_end).toDate() : "Class default"],
    [`custom_a_cap%${uid}`]: ["number", custom_a_cap],
    [`custom_b_cap%${uid}`]: ["number", custom_b_cap],
    [`custom_c_cap%${uid}`]: ["number", custom_c_cap],
    [`custom_d_cap%${uid}`]: ["number", custom_d_cap]
  };

  let {formFieldValues, setFormFieldValue,
        setFormFieldsDirectly, flags, setFlags, myCallbacks, showErrorDetails,
        setShowErrorDetails} = useFormManagement(fieldsAndValidators);

  // console.log("defaults******");
  // console.log(defaults);

  const clearFieldValue = fieldLabel => {
    setFormFieldValue(null, fieldLabel);

    const updateData = {[fieldLabel.split("%")[0]]: null,
                        name: uid, class_section: courseId};
    sendFormRequest(null, setFormFieldValue,
      {formId: `dashboard-student-info-${first_name}_${last_name}_${uid}`,
        fieldSet: updateData,
        requestAction: () => doApiCall(updateData, "update_student_data",
                                      "form"),
        history: history,
        dispatch: dispatch,
        successCallback: myCallbacks.successAction,
        otherCallbacks: {
          serverErrorAction: myCallbacks.serverErrorAction,
          badRequestDataAction: myCallbacks.badRequestDataAction,
          insufficientPrivilegesAction: myCallbacks.insufficientPrivilegesAction,
          notLoggedInAction: myCallbacks.notLoggedInAction
        },
        setInProgressAction: setClearingValue
      });
  }

  const updateStudentData = event => {
    event.preventDefault();
    // console.log("submitting--------");
    // console.log(formFieldValues);
    // console.log(Object.entries(formFieldValues));
    let submitValues = Object.entries(formFieldValues).map(
      ([key, value], i) => {
        // const newKey = key.split("%")[0];
        // const newValue = value===defaults[newKey] ? undefined : value;
        return([key.split("%")[0], value])
      }
    );
    let submitObject = Object.fromEntries(submitValues);
    // console.log('submitObject');
    // console.log(submitObject);
    submitObject.class_section = courseId;
    let myStartString = (!!submitObject.custom_start && submitObject.custom_start!=="Class default") ? submitObject.custom_start.toISOString() : null;
    let myEndString = (!!submitObject.custom_end && submitObject.custom_end!=="Class default") ? submitObject.custom_end.toISOString() : null;
    const updateData = {...submitObject, name: uid,
                        custom_start: myStartString, custom_end: myEndString};

    sendFormRequest(null, setFormFieldValue,
      {formId: `dashboard-student-info-${first_name}_${last_name}_${uid}`,
        fieldSet: updateData,
        requestAction: () => doApiCall(updateData, "update_student_data",
                                      "form"),
        history: history,
        dispatch: dispatch,
        successCallback: myCallbacks.successAction,
        otherCallbacks: {
          serverErrorAction: myCallbacks.serverErrorAction,
          badRequestDataAction: myCallbacks.badRequestDataAction,
          insufficientPrivilegesAction: myCallbacks.insufficientPrivilegesAction,
          notLoggedInAction: myCallbacks.notLoggedInAction
        },
        setInProgressAction: setFetchingStudent
      });
  }

  const doPromotion = () => {
    doApiCall({uid: uid, classid: courseId}, "promote_user", "JSON")
    .then( respdata => {
        returnStatusCheck(respdata, history,
          (mydata) => {
            setPromotingInProgress(false);
            setShowPromotionConfirm(false);
          },
          dispatch,
          {serverErrorAction: () => setPromotionFailed("Unknown server error"),
           missingRequestDataAction: () => setPromotionFailed("The user information was not sent properly"),
           insufficientPrivilegesAction: () => setPromotionFailed("You don't have permission to perform promotions")
          }
        );
    })
  }

  const doDemotion = () => {
    doApiCall({uid: uid, classid: courseId}, "demote_user", "JSON")
    .then( respdata => {
        returnStatusCheck(respdata, history,
          (mydata) => {
            setDemotingInProgress(false);
            setShowDemotionConfirm(false);
          },
          dispatch,
          {serverErrorAction: () => setDemotionFailed("Unknown server error"),
           missingRequestDataAction: () => setDemotionFailed("The user information was not sent properly"),
           insufficientPrivilegesAction: () => setDemotionFailed("You don't have permission to perform demotions")
          }
        );
    })
  }

  return(
    <>
    <Modal show={showPromotionConfirm} onHide={() => setShowPromotionConfirm(false)}>
      <Modal.Header closeButton>
        <Modal.Title>Confirm promotion</Modal.Title>
      </Modal.Header>
      <Modal.Body>Are you sure you want to promote this student ahead to the next badge set?<br /><br/>
        <b>Warning: This action cannot be undone.</b> If you later demote them again they will be placed at the <i>beginning</i> of the badge set, not their original position.
        {promotionFailed !== "" &&
          <Alert variant="danger">
            Something went wrong trying to promote this user: {promotionFailed}
          </Alert>
        }
      </Modal.Body>
      <Modal.Footer>
        {!promotingInProgress ?
          <Button variant="warning" onClick={doPromotion}>
            Yes
          </Button>
        :
          <Button variant="warning" disabled>
            <Spinner animation="grow" />
          </Button>
        }
        {!promotingInProgress ?
        <Button variant="danger" onClick={() => setShowPromotionConfirm(false)}>
          Cancel promoting
        </Button>
        :
          <Button variant="danger" disabled>
            <Spinner animation="grow" />
          </Button>
        }
      </Modal.Footer>
    </Modal>

    <Modal show={showDemotionConfirm} onHide={() => setShowDemotionConfirm(false)}>
      <Modal.Header closeButton>
        <Modal.Title>Confirm demotion</Modal.Title>
      </Modal.Header>
      <Modal.Body>Are you sure you want to move this student back to the next badge set? <br/><br/>
        <b>Warning: This action cannot be undone.</b> If you later promote them again they will be placed at the <i>beginning</i> of the badge set, not their original position.
        {demotionFailed !== "" &&
          <Alert variant="danger">Something went wrong trying to demote this user: {demotionFailed}
          </Alert>
        }
      </Modal.Body>
      <Modal.Footer>
        {!demotingInProgress ?
          <Button variant="warning" onClick={doDemotion}>
            Yes
          </Button>
        :
          <Button variant="warning" disabled>
            <Spinner animation="grow" />
          </Button>
        }
        {!demotingInProgress ?
        <Button variant="danger" onClick={() => setShowDemotionConfirm(false)}>
          Cancel Demoting
        </Button>
        :
          <Button variant="danger" disabled>
            <Spinner animation="grow" />
          </Button>
        }
      </Modal.Footer>
    </Modal>

    <Form role="form"
      id={`dashboard-student-info-${first_name}_${last_name}_${uid}`}
    >
      <Row >
        <Col md={3}>
          <Link to={`/${urlBase}/profile/${uid}`}>
            {last_name}, {first_name}
          </Link>
        </Col>
        <Col md={2}>
          <span className="dashboard-student-info-current">
            <span className="dashboard-student-info-current-label">
              {!!classInProcess ? "Current" : "Final"} badge set
            </span>
            {!!classInProcess ? current_set : ending_set }
          </span>
        </Col>
        <Col md={2}>
          <span className="dashboard-student-info-starting-set">
            <span className="dashboard-student-info-starting-set-label">
              Started at set
            </span>
            {starting_set}
          </span>
        </Col>
        <Col md={2}>
          <span className="dashboard-student-info-progressed">
            <span className="dashboard-student-info-progressed-label">
              Progressed
            </span>
            {progress} sets
          </span>
        </Col>
        <Col md={1}>
          <span className="dashboard-student-info-letter">
            <span className="dashboard-student-info-letter-label">
              Earned{!!classInProcess ? " so far" : ""}
            </span>
            {grade}
          </span>
        </Col>
        <Col md={1}>
          <ButtonGroup>
            <Button className="dashboard-student-info-promote"
              onClick={() => setShowPromotionConfirm(true)} size="sm" variant="warning"
            >
              <FontAwesomeIcon icon="arrow-up" size="sm" />
            </Button>
            <Button className="dashboard-student-info-demote"
              onClick={() => setShowDemotionConfirm(true)} size="sm" variant="warning"
            >
              <FontAwesomeIcon icon="arrow-down" size="sm" />
            </Button>
          </ButtonGroup>
        </Col>
        <Col md={1}>
          <Button className="dashboard-student-info-show-details"
            onClick={() => setShowStudentDetails(!showStudentDetails)} size="sm" variant="primary"
          >
            <FontAwesomeIcon icon="angle-down" size="sm" />
          </Button>
        </Col>
      </Row>
      <Collapse in={showStudentDetails}>
        <div className="dashboard-student-details-container">
      <Row>
        <Col xs={12} md={6}>
          <h4>Recent Activity</h4>
          <Table className="dashboard-student-info-active" size="sm">
            <thead>
              <tr>
                <td></td>
                <td>Days active</td>
                <td>Days meeting minimum</td>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>This week</td>
                <td>{counts[0]}</td>
                <td>{counts[1]}</td>
              </tr>
              <tr>
                <td>Last week</td>
                <td>{counts[2]}</td>
                <td>{counts[3]}</td>
              </tr>
            </tbody>
          </Table>
        </Col>
        <Col xs={12} md={6} classNames="dashboard-student-info-dates">
          <h4>Individual Course Dates</h4>
          <Row>
            <Form.Group controlId={`custom_start%${uid}`}
              classNames={!formFieldValues[`custom_start%${uid}`] ? "default-value" : ""}
            >
              <Form.Label>Individual start date</Form.Label>

              <InputGroup>
                <DayPickerInput
                  onDayChange={day => setFormFieldValue(day, `custom_start%${uid}`)}
                  component={props => <Form.Control {...props} />}
                  formatDate={formatDate}
                  parseDate={parseDate}
                  format="LL"
                  value={formFieldValues[`custom_start%${uid}`] || "Class default"}
                  placeholder={`${formatDate(
                    formFieldValues[`custom_start%${uid}`], 'LL')}`}
                  onChange={e => setFormFieldValue(e.target.value, `custom_start%${uid}`)}
                />
                  <Button variant="outline-warning"
                    disabled={clearingValue}
                    onClick={() => clearFieldValue(`custom_start%${uid}`)}
                  >
                    <FontAwesomeIcon icon="undo-alt" />
                  </Button>
              </InputGroup>
              <Form.Text>Default is {formatDate(defaults.custom_start, 'LL')}
              </Form.Text>
            </Form.Group>
          </Row>
          <Row>
            <Form.Group controlId={`custom_end%${uid}`}
              classNames={!formFieldValues[`custom_end%${uid}`] ? "default-value" : ""}
            >
              <Form.Label>Individual end date</Form.Label>
              <InputGroup>
                <DayPickerInput
                  onDayChange={day => setFormFieldValue(day, `custom_end%${uid}`)}
                  component={props => <Form.Control {...props} />}
                  formatDate={formatDate}
                  parseDate={parseDate}
                  format="LL"
                  value={formFieldValues[`custom_end%${uid}`] || "Class default"}
                  placeholder={`${formatDate(
                    new Date(formFieldValues[`custom_end%${uid}`]), 'LL')}`}
                  onChange={e => setFormFieldValue(e.target.value, `custom_end%${uid}`)}
                />
                  <Button variant="outline-warning"
                    disabled={clearingValue}
                    onClick={() => clearFieldValue(`custom_end%${uid}`)}
                  >
                    <FontAwesomeIcon icon="undo-alt" />
                  </Button>
              </InputGroup>
              <Form.Text>Default is {formatDate(defaults.custom_end, 'LL')}
              </Form.Text>
            </Form.Group>
          </Row>
        </Col>
        <Col xs={12} md={8} classNames="dashboard-student-info-caps">
          <h4>Individual grade caps</h4>
          <Table bordered size="sm">
            <thead>
              <tr>
                <td>A</td>
                <td>B</td>
                <td>C</td>
                <td>D</td>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <Form.Group controlId={`custom_a_cap%${uid}`}
                    className={!formFieldValues[`custom_a_cap%${uid}`] ? "default-value" : ""}
                  >
                    <InputGroup>
                      <Form.Control
                        value={formFieldValues[`custom_a_cap%${uid}`] || "default"}
                        onChange={e => setFormFieldValue(!!isIntegerString(e.target.value) ? parseInt(e.target.value) : null, `custom_a_cap%${uid}`)}
                      />
                      <Button variant="outline-warning"
                        disabled={clearingValue}
                        onClick={() => clearFieldValue(`custom_a_cap%${uid}`)}
                      >
                        <FontAwesomeIcon icon="undo-alt" />
                      </Button>
                    </InputGroup>
                    <Form.Text>
                      Default is {defaults.custom_a_cap}
                    </Form.Text>
                  </Form.Group>
                </td>
                <td>
                  <Form.Group controlId={`custom_b_cap%${uid}`}
                    className={!formFieldValues[`custom_b_cap%${uid}`] ? "default-value" : ""}
                  >
                    <InputGroup>
                      <Form.Control
                        value={formFieldValues[`custom_b_cap%${uid}`] || "default"}
                        onChange={e => setFormFieldValue(!!isIntegerString(e.target.value) ? parseInt(e.target.value) : null, `custom_b_cap%${uid}`)}
                      />
                        <Button variant="outline-warning"
                          disabled={clearingValue}
                          onClick={() => clearFieldValue(`custom_b_cap%${uid}`)}
                        >
                          <FontAwesomeIcon icon="undo-alt" />
                        </Button>
                    </InputGroup>
                    <Form.Text>
                      Default is {defaults.custom_b_cap}
                    </Form.Text>
                  </Form.Group>
                </td>
                <td>
                  <Form.Group controlId={`custom_c_cap%${uid}`}
                    className={!formFieldValues[`custom_c_cap%${uid}`] ? "default-value" : "new-value"}
                  >
                    <InputGroup>
                      <Form.Control
                        value={formFieldValues[`custom_c_cap%${uid}`] || "default"}
                        onChange={e => setFormFieldValue(!!isIntegerString(e.target.value) ? parseInt(e.target.value) : null, `custom_c_cap%${uid}`)}
                      />
                        <Button variant="outline-warning"
                          disabled={clearingValue}
                          onClick={() => clearFieldValue(`custom_c_cap%${uid}`)}
                        >
                          <FontAwesomeIcon icon="undo-alt" />
                        </Button>
                    </InputGroup>
                    <Form.Text>
                      Default is {defaults.custom_c_cap}
                    </Form.Text>
                  </Form.Group>
                </td>
                <td>
                  <Form.Group controlId={`custom_d_cap%${uid}`}
                    className={!formFieldValues[`custom_d_cap%${uid}`] ? "default-value" : ""}
                  >
                    <InputGroup>
                      <Form.Control
                        value={formFieldValues[`custom_d_cap%${uid}`] || "default"}
                        onChange={e => setFormFieldValue(!!isIntegerString(e.target.value) ? parseInt(e.target.value) : null, `custom_d_cap%${uid}`)}
                        className={formFieldValues[`custom_d_cap%${uid}`]===defaults.custom_d_cap ? "default-value" : ""}
                      />
                        <Button variant="outline-warning"
                          disabled={clearingValue}
                          onClick={() => clearFieldValue(`custom_c_cap%${uid}`)}
                        >
                          <FontAwesomeIcon icon="undo-alt" />
                        </Button>
                    </InputGroup>
                    <Form.Text>
                      Default is {defaults.custom_d_cap}
                    </Form.Text>
                  </Form.Group>
                </td>
              </tr>
            </tbody>
          </Table>
        </Col>
        <Col xs={12} md={4}>
          <Button variant="primary"
              type="submit"
              onClick={updateStudentData}
              disabled={!!fetchingStudent ? true : false }
          >
            <FontAwesomeIcon icon="save" /> Save changes
          </Button>
          {!!flags.serverError &&
            <Alert variant="danger">
              <Col xs="auto">
                <FontAwesomeIcon size="2x" icon="exclamation-triangle" />
              </Col>
              <Col xs="10">
                Sorry, something went wrong submitting that change.
              </Col>
            </Alert>
          }
        </Col>
      </Row>
      </div>

    </Collapse>
  </Form>
  </>
  );
}

const InstructorDashboard = () => {

    const { user, dispatch } = useContext(UserContext);
    const myhistory = useHistory();
    const myLocation = useLocation();
    const joiningLoc = myLocation.pathname.split('/').slice(0,-2).join('/') + '/join_course'
    const [ courseKey, setCourseKey ] = useState();
    const [ myClasses, setMyClasses ] = useState(!!user.instructing ?
      user.instructing.sort(
        (a, b) => (Date.parse(a.start_date) > Date.parse(b.start_date)) ? -1 : 1)
      :
      []
    );
    const [ activeClassId, setActiveClassId ] = useState(
      myClasses.length > 0 ? myClasses[0].id : 0);
    // const [ activeClassInfo, setActiveClassInfo ] = useState(myClasses[0]);
    const [ classInProcess, setClassInProcess ] = useState(myClasses[0].in_process || undefined);
    const [ classMembers, setClassMembers ] = useState([]);
    const [ classInstructor, setClassInstructor ] = useState(undefined);
    const [ fetchingClass, setFetchingClass ] = useState(false);
    const history = useHistory();

    let classFieldsAndValidators = {id: null, institution: "string",
                                    academic_year: null, term: "string",
                                    course_section: "string",
                                    start_date: null, end_date: null,
                                    paths_per_day: "integer",
                                    days_per_week: "integer",
                                    a_target: "integer", b_target: "integer",
                                    c_target: "integer", d_target: "integer",
                                    f_target: "integer",
                                    a_cap: null, b_cap: null,
                                    c_cap: null, d_cap: null
                                   }

    // flags are unauthorized, serverError, badRequest, noRecord, success
    // callbacks are serErrorAction, unauthorizedAction,
    // badRequestDataAction, noRecordAction, successAction
    let {formFieldValues, setFormFieldValue, setFormFieldValuesDirectly,
         flags, setFlags, myCallbacks, showErrorDetails, setShowErrorDetails
        } = useFormManagement(classFieldsAndValidators);
    // console.log("in main component: formFieldValues is:");
    // console.log(formFieldValues);
    // console.log("in main component: classMembers is:");
    // console.log(classMembers);

    useEffect(() => {
      if ( activeClassId!==0 ) {
        setFetchingClass(true);
        doApiCall({course_id: activeClassId}, 'get_course_data', "JSON")
        .then(info => {
          returnStatusCheck(info, history,
            info => {
              // console.log(info);
              if ( info.hasOwnProperty("institution") ) {
                let currentValues = {...formFieldValues};
                Object.keys(info).forEach(field => {
                  // console.log(`setting ${field} value: ${info[field]}`);
                  if (['start_date', 'end_date'].includes(field)) {
                    // console.log(`setting ${field} value: ${info[field]}`);
                    currentValues = {...currentValues,
                                     [field]: moment(info[field]).toDate()};
                  } else if (!["members", "status"].includes(field)) {
                    currentValues = {...currentValues, [field]: info[field]};
                  }
                });
                setFormFieldValuesDirectly(currentValues);
                setClassMembers(info.members);
                setClassInstructor(info.instructor);
                setCourseKey(info.class_key);
                setClassInProcess(info.in_process);
                myCallbacks.successAction();
                setFetchingClass(false);
              } else {
                myCallbacks.serverErrorAction();
              }
            },
            dispatch,
            {insufficientPrivilegesAction: myCallbacks.unauthorizedAction,
            noRecordAction: myCallbacks.noRecordAction,
            serverErrorAction: myCallbacks.serverErrorAction
            }
          );
        });
      }
    }, [activeClassId]);

    const updateClassData = (event) => {
      event.preventDefault();
      let myStartString = formFieldValues.start_date.toISOString();
      let myEndString = formFieldValues.end_date.toISOString();
      const updateData = {...formFieldValues, id: activeClassId,
                          start_date: myStartString, end_date: myEndString,
                          instructor: classInstructor.id};

      sendFormRequest(null, setFormFieldValue,
        {formId: 'dashboard-class-info-form',
         fieldSet: updateData,
         requestAction: () => doApiCall(updateData, "update_course_data",
                                        "form"),
         history: myhistory,
         dispatch: dispatch,
         successCallback: myCallbacks.successAction,
         otherCallbacks: {
           serverErrorAction: myCallbacks.serverErrorAction,
           badRequestDataAction: myCallbacks.badRequestDataAction,
           insufficientPrivilegesAction: myCallbacks.insufficientPrivilegesAction,
           notLoggedInAction: myCallbacks.notLoggedInAction
         },
         setInProgressAction: setFetchingClass
        });
    }
    // console.log("flags:");
    // console.log(flags);

    return(
      <Row className="dashboard-component">
        <Col className="dashboard-component-inner-wrapper">
          { (!user || user.userLoggedIn !== true || !!flags.notLoggedIn ) &&
              myhistory.push(`/${urlBase}/login?need_login=true`)
          }
          { ( !user.userRoles || !["instructors", "administrators"]
                  .some(r => user.userRoles.includes(r) ) || !!flags.insufficientPrivileges ) ?
            <Alert variant="danger">
              <Col xs="auto">
                <FontAwesomeIcon size="2x" icon="exclamation-triangle" />
              </Col>
              <Col xs="10">
                Sorry, you have to be logged in as an instructor or administrator to enter this area.
              </Col>
            </Alert>
            :
          <React.Fragment>
          <h2>My Dashboard</h2>
          <Form.Group controlId="classFormClassSelector" className="class-group-selector">
            <Form.Label>Choose a class group</Form.Label>
            <Form.Control as="select"
              onChange={e => setActiveClassId(e.target.value)}
            >
              {myClasses.map((c, index) =>
                <option key={index} value={c.id}>
                  {`${c.course_section}, ${c.term}, ${c.academic_year}, ${c.institution}`}
                </option>
              )}
            </Form.Control>
          </Form.Group>

        <Tabs>
        <Tab eventKey="course-details" title="Course Details" className="course-details">
        {!!fetchingClass ?
          <Spinner animation="grow" variant="info" />
          :
          <Form role="form"
            id="dashboard-class-info-form"
          >
            <Row>
              <Col className="dashboard-class-basic" xs={12} md={6} lg={4}>
                <Container>
                  <h3>Basic Info<FontAwesomeIcon icon="graduation-cap" /></h3>
                  <Row>
                    <Form.Group controlId="institution">
                      <Form.Label>Institution</Form.Label>
                      <Form.Control
                        value={formFieldValues.institution || ''}
                        onChange={e => setFormFieldValue(e.target.value, "institution")}
                      ></Form.Control>
                    </Form.Group>
                    </Row>
                    <Row>
                    <Form.Group controlId="course_section">
                      <Form.Label>Course Title</Form.Label>
                      <Form.Control
                        value={formFieldValues.course_section || ''}
                        onChange={e => setFormFieldValue(e.target.value, "course_section")}
                      ></Form.Control>
                    </Form.Group>
                    </Row>
                    <Row>
                      <Col>
                        <Form.Group controlId="academic_year">
                          <Form.Label>Year</Form.Label>
                          <Form.Control
                            value={formFieldValues.academic_year || ''}
                            onChange={e => setFormFieldValue(e.target.value, "academic_year")}
                          ></Form.Control>
                        </Form.Group>
                      </Col>
                      <Col>
                        <Form.Group controlId="term">
                          <Form.Label>Term</Form.Label>
                          <Form.Control
                            value={formFieldValues.term || ''}
                            onChange={e => setFormFieldValue(e.target.value, "term")}
                          ></Form.Control>
                        </Form.Group>
                      </Col>
                  </Row>
                  <Row>
                    <Form.Group controlId="instructor">
                      <Form.Label>Instructor</Form.Label>
                      <Form.Control
                        value={!!classInstructor ? `${classInstructor.first_name} ${classInstructor.last_name}` : ""}
                        disabled
                      ></Form.Control>
                    </Form.Group>
                  </Row>
                </Container>
              </Col>
              <Col className="dashboard-class-key" xs={12} md={6} lg={4}>
                <Container>
                  <h3>Course Registration Key<FontAwesomeIcon icon="key" /></h3>
                  <Row>
                    <span className="dashboard-class-key-string">{courseKey}</span>
                    <Form.Text>Give this key to students in your classes. To join this course group in Paideia, they need to enter the key at this link:
                    </Form.Text>
                      {/* <fontawesomeicon icon="link" size="sm" /> */}
                    <Link to={joiningLoc}>https://learngreek.ca<wbr />/<wbr />paideia<wbr />/<wbr />join_course</Link>
                  </Row>
                  <Row>
                    <Alert variant="info">Note that each student will be required to upgrade their account to "Student" level (paid) to join the course group if they are not already a premium supporter.
                    </Alert>
                  </Row>
                </Container>
              </Col>
              <Col className="dashboard-class-info" xs={12} md={6} lg={4}>
                <Container>
                  <h3>Course Dates<FontAwesomeIcon icon="calendar-check"  /></h3>
                  <Row className="start-date-picker">
                      <Form.Group controlId="start_date">
                        <Form.Label>Begins</Form.Label>
                        <DayPickerInput
                          onDayChange={day => setFormFieldValue(day, "start_date")}
                          formatDate={formatDate}
                          parseDate={parseDate}
                          format="LL"
                          // dayPickerProps={{
                          //   selectedDays: formFieldValues.start_date
                          // }}
                          value={formFieldValues.start_date}
                          placeholder={`${formatDate(new Date(formFieldValues.start_date), 'LL')}`}
                          onChange={e => setFormFieldValue(e.target.value, "start_date")}
                          // classNames="form-control"
                        />
                      </Form.Group>
                  </Row>
                  <Row className="end-date-picker">
                      <Form.Group controlId="end_date">
                        <Form.Label>Ends</Form.Label>
                        <DayPickerInput
                          onDayChange={day => setFormFieldValue(day, "end_date")}
                          formatDate={formatDate}
                          parseDate={parseDate}
                          format="LL"
                          // dayPickerProps={{
                          //   selectedDays: formFieldValues.end_date
                          // }}
                          value={formFieldValues.end_date}
                          placeholder={`${formatDate(new Date(formFieldValues.end_date), 'LL')}`}
                          onChange={e => setFormFieldValue(e.target.value, "end_date")}
                          // classNames="form-control"
                        />
                      </Form.Group>
                  </Row>
                  <h3>Minimum Participation<FontAwesomeIcon icon="check-circle"  /></h3>
                  <Row>
                      <Form.Text>
                          How much will you require your students to use Paideia? The app will track whether students are meeting these minimum targets.
                      </Form.Text>
                  </Row>
                  <Row>
                      <Col>
                        <Form.Group controlId="paths_per_day">
                          <Form.Label>Paths per day</Form.Label>
                          <Form.Control
                            value={formFieldValues.paths_per_day || ''}
                            onChange={e => setFormFieldValue(parseInt(e.target.value), "paths_per_day")}
                          ></Form.Control>
                        </Form.Group>
                      </Col>
                      <Col>
                        <Form.Group controlId="days_per_week">
                          <Form.Label>Days per week</Form.Label>
                          <Form.Control
                            value={formFieldValues.days_per_week || ''}
                            onChange={e => setFormFieldValue(parseInt(e.target.value), "days_per_week")}
                          ></Form.Control>
                        </Form.Group>
                      </Col>
                  </Row>
                </Container>
              </Col>
              <Col className="dashboard-class-targets" xs={12} md={6} lg={12}>
                <Container>
                  <h3>Grading Targets<FontAwesomeIcon icon="bullseye"  /></h3>
                  <Table size="sm">
                    <thead>
                      <tr>
                        <th>Letter Grade</th>
                        <th>Personal Set Progress</th>
                        <th></th>
                        <th>Absolute Set Reached</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>A</td>
                        <td>
                          <FormGroup controlId="a_target">
                            <label>began</label>
                            <Form.Control value={formFieldValues.a_target || ''}
                              onChange={e => setFormFieldValue(parseInt(e.target.value), "a_target")}
                            />
                            <label>new sets</label>
                          </FormGroup>
                        </td>
                        <td>OR</td>
                        <td>
                          <FormGroup controlId="a_cap">
                            <label>set number</label>
                            <Form.Control value={formFieldValues.a_cap || ''}
                              onChange={e => setFormFieldValue(parseInt(e.target.value), "a_cap")}
                            />
                            <label>reached</label>
                          </FormGroup>
                        </td>
                      </tr>
                      <tr>
                        <td>B</td>
                        <td>
                          <FormGroup controlId="b_target">
                            <label>began</label>
                            <Form.Control value={formFieldValues.b_target || ''}
                              onChange={e => setFormFieldValue(parseInt(e.target.value), "b_target")}
                            />
                            <label>new sets</label>
                          </FormGroup>
                        </td>
                        <td>OR</td>
                        <td>
                          <FormGroup controlId="b_cap">
                            <label>set number</label>
                            <Form.Control value={formFieldValues.b_cap || ''}
                              onChange={e => setFormFieldValue(parseInt(e.target.value), "b_cap")}
                            />
                            <label>reached</label>
                          </FormGroup>
                        </td>
                      </tr>
                      <tr>
                        <td>C</td>
                        <td>
                          <FormGroup controlId="c_target">
                            <label>began</label>
                            <Form.Control value={formFieldValues.c_target || ''}
                              onChange={e => setFormFieldValue(parseInt(e.target.value), "c_target")}
                            />
                            <label>new sets</label>
                          </FormGroup>
                        </td>
                        <td>OR</td>
                        <td>
                          <FormGroup controlId="c_cap">
                            <label>set number</label>
                            <Form.Control value={formFieldValues.c_cap || ''}
                              onChange={e => setFormFieldValue(parseInt(e.target.value), "c_cap")}
                            />
                            <label>reached</label>
                          </FormGroup>
                        </td>
                      </tr>
                      <tr>
                        <td>D</td>
                        <td>
                          <FormGroup controlId="d_target">
                            <label>began</label>
                            <Form.Control value={formFieldValues.d_target || ''}
                              onChange={e => setFormFieldValue(parseInt(e.target.value), "d_target")}
                            />
                            <label>new sets</label>
                          </FormGroup>
                        </td>
                        <td>OR</td>
                        <td>
                          <FormGroup controlId="d_cap">
                            <label>set number</label>
                            <Form.Control value={formFieldValues.d_cap || ''}
                              onChange={e => setFormFieldValue(parseInt(e.target.value), "d_cap")}
                            />
                            <label>reached</label>
                          </FormGroup>
                        </td>
                      </tr>
                      <tr>
                        <td>F</td>
                        <td>
                          <FormGroup controlId="f_target">
                            <label>began</label>
                            <Form.Control value={formFieldValues.f_target || ''}
                              onChange={e => setFormFieldValue(parseInt(e.target.value), "f_target")}
                            />
                            <label>new sets</label>
                          </FormGroup>
                        </td>
                        <td>OR</td>
                        <td>
                          NA
                        </td>
                      </tr>
                    </tbody>
                  </Table>
                </Container>
              </Col>
            </Row>
            <Row className="course-form-submit">
              <Button variant="primary"
                  type="submit"
                  onClick={updateClassData}
                  disabled={!!fetchingClass ? true : false }
              >
                <FontAwesomeIcon icon="save" /> Save changes
              </Button>
            </Row>
          </Form>
        }
        </Tab> {/* end of course parameters tab */}

        <Tab eventKey="course-students" title="Students"
          className="course-students"
        >
        {!!fetchingClass ?
          <Spinner animation="grow" variant="info" />
          :
          <React.Fragment>
          {!!classMembers && classMembers.length > 0 &&
            classMembers.map(m =>
              <StudentRow studentData={m}
                classInProcess={classInProcess}
                history={myhistory}
                dispatch={dispatch}
                key={`${m.first_name}_${m.last_name}_${m.uid}`}
                defaults={
                  {custom_start: formFieldValues.start_date,
                   custom_end: formFieldValues.end_date,
                   custom_a_cap: formFieldValues.a_cap,
                   custom_b_cap: formFieldValues.b_cap,
                   custom_c_cap: formFieldValues.c_cap,
                   custom_d_cap: formFieldValues.d_cap
                }}
                courseId={formFieldValues.id}
              />
          )}
          </React.Fragment>
        }
        </Tab>
        </Tabs>
        </React.Fragment>
        }
        </Col>
      </Row>
    )
}

export default InstructorDashboard;