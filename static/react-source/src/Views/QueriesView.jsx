import React, {
         useContext,
         useState,
         useEffect,
         useRef
} from "react";
import { Alert,
         Badge,
         Button,
         Col,
         Collapse,
         Form,
         FormControl,
         FormLabel,
         OverlayTrigger,
         Pagination,
         Row,
         Spinner,
        //  Table,
         Tooltip,
} from "react-bootstrap";
import { useHistory,
         useLocation,
         useParams,
         Link
} from "react-router-dom";
import { SwitchTransition, CSSTransition } from "react-transition-group";
import { marked } from "marked";
// import DOMPurify from 'dompurify';
import TextareaAutosize from 'react-textarea-autosize';
import Select from 'react-select';
import { Formik } from "formik";
import * as Yup from "yup";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import { findIndex } from "core-js/es/array";

import { UserContext } from "../UserContext/UserProvider";
import { getQueriesMetadata,
         getViewQueries,
         addQuery,
         updateQuery,
         addQueryReply,
         updateQueryReply,
         addReplyComment,
         updateReplyComment,
         updateReadStatus
 } from "../Services/queriesService";
import { returnStatusCheck } from "../Services/utilityService";
import { readableDateAndTime } from "../Services/dateTimeService";
import { DEBUGGING } from "../variables";
import { FormErrorMessage } from "../Services/formsService";


const roles = {instructors: "chalkboard-teacher",
               administrators: "hard-hat",
               students: "graduation-cap"
               }

const RoleIcon = ({icon}) => {
  return ( <OverlayTrigger placement="top"
             className={`role-icon-${icon}`}
             overlay={
               <Tooltip id={`tooltip-role-${icon}`}>{icon.slice(0, -1)}</Tooltip>
             }
           >
             <FontAwesomeIcon icon={roles[icon]} />
             {/* <span>{icon}</span> */}
           </OverlayTrigger>
  )
}

const AdderButton = ({level, showAdderValue, showAdderAction, label, icon}) => {
  return (
    <span className={`adder-button-container`}>
      <Button variant="outline-secondary"
        onClick={() => showAdderAction(!showAdderValue)}
        aria-controls={`add-${level}-form-wrapper`}
        aria-expanded={showAdderValue}
      >
        <FontAwesomeIcon icon={icon} />
        {label}
      </Button>
    </span>
  )
}

const ControlRow = ({userId, opId, level, classId, icon, showAdderValue,
                     showAdderAction=null,
                     showEditorAction, updateAction, defaultUpdateArgs,
                     userRoles, instructing, showPublic,
                     flagged, pinned, popularity, helpfulness, userLoggedIn
                    }) => {
  const labelLevel = level === "query" ? "reply" : "comment";
  let myPop = Array.isArray(popularity) ? popularity : [];
  let myHelp = Array.isArray(helpfulness) ? helpfulness : [];
  return(
    <div className={`control-row control-row-${level}`}>
      { level !== "comment" && (
        !!userLoggedIn ?
        <AdderButton level={level}
          showAdderValue={showAdderValue}
          showAdderAction={showAdderAction}
          label={`Add your ${labelLevel}`}
          icon={icon}
        />
        :
        <span className={`control-row-login-msg`}><Link to="login">Log in</Link> to add your {labelLevel}</span>
        )
      }
      {userId === opId &&
        <Button variant="outline-secondary"
          onClick={e => showEditorAction(e)}
        >
          <FontAwesomeIcon icon="pencil-alt" />
        </Button>
      }
      {userId === opId &&
        <Button variant="outline-secondary"
          onClick={e =>
            updateAction({...defaultUpdateArgs,
                          deleted: true, event: e})
          }
        >
          <FontAwesomeIcon icon="trash-alt" />
        </Button>
      }
      {userId !== opId &&
        <Button variant="outline-secondary"
          onClick={e => {
            if (myPop.includes(userId)) {
              const i = myPop.indexOf(userId);
              myPop.splice(i, 1);
            } else {
              myPop.push(userId);
            }
            updateAction({...defaultUpdateArgs, popularity: myPop, event: e})
          }}
        >
          <FontAwesomeIcon icon="thumbs-up" /> {myPop.length}
        </Button>
      }
      {((userRoles.includes("administrators") || userRoles.includes("instructors")) && !!classId && instructing.find(c => c.id===classId)) &&
        <Button variant="outline-secondary"
          onClick={e =>
            updateAction({...defaultUpdateArgs, pinned: !pinned, event: e})
          }
        >
          <FontAwesomeIcon icon="thumbtack" />
        </Button>
      }
      {(userRoles.includes("administrators") || userRoles.includes("instructors")) &&
        <Button variant="outline-secondary"
          onClick={e => {
            if (myHelp.includes(userId)) {
              const i = myHelp.indexOf(userId);
              myHelp.splice(i, 1);
            } else {
              myHelp.push(userId);
            }
            updateAction({...defaultUpdateArgs, helpfulness: myHelp, event: e})
          }}
        >
          <FontAwesomeIcon icon="lightbulb" />
          {myHelp.length}
        </Button>
      }
    </div>
  )
}

const UpdateForm = ({level, idArgs, updateAction, updateField="opText",
                     currentText, setEditingAction,
                     autosize=true, optionList=null,
                     submitButton=true, labels=false, inline="false"
                    }) => {
  const [myText, setMyText] = useState();
  const idString = Object.values(idArgs).join("-");
  const FormComponent = !!autosize ? TextareaAutosize : FormControl;
  // const [changing, setChanging] = useState(false);
  const sendUpdate = e => {
    e.preventDefault();
    updateAction({...idArgs,
      [updateField]: updateField==="score" ? parseFloat(myText) : myText});
    setEditingAction(false);
  }
  useEffect(() => {
    if ( !!optionList && !!myText ) {
      sendUpdate(new Event('dummy'));
    }
  }, [myText, optionList]);

  return (
    <Form id={`update-${level}-${updateField}-form-${idString}`}
      className={`update-${level}-${updateField}-form update-form`}
      inline={inline}
    >
        <Form.Group controlId={`update-${level}-${updateField}-input-${idString}`}>
          {!!labels && <FormLabel>{updateField}</FormLabel>}
          <FormComponent
            as={!autosize ? (!!optionList ? "select" : "input") : undefined }
            defaultValue={!optionList ? currentText : parseInt(currentText) }
            onChange={e => setMyText(e.target.value)}
            onSubmit={sendUpdate}
            size="sm"
          >
            {!!optionList ?
              optionList.map((label, index) =>
                <option value={index} key={label}
                  // selected={index===parseInt(currentText) ? "selected" : false}
                >
                  {label.replace("_", " ")}
                </option>)
              : null
            }
          </FormComponent>
        </Form.Group>
        {!!submitButton &&
          <Button variant="primary"
            type="submit"
            onClick={e => sendUpdate(e)}
          >Update {level}</Button>
        }
    </Form>
  )
}

/**
 * A Formik-based react component to submit a new query
 *
 * @param {string}   answer The text of the answer submitted for the
 *                          current step attempt if there is one
 * @param {number}   score  The score awarded for the current step
 *                          if there is one
 * @param {function} action The function to use for submitting the form
 * @param {boolean}  nonStep  Indicates whether the currently viewed
 *                            category of queries is those not linked to
 *                            a specific step
 * @param {boolean} singleStep  Indicates whether there is currently a
 *                              specific step attempt active in context
 * @returns React component containing the form and wrapping entities
 */
const NewQueryForm = ({answer, score, action, nonStep, singleStep}) => {
  const [ showForm, setShowForm ] = useState(false);
  const [ submissionSucceeded, setSubmissionSucceeded ] = useState(false);
  const [ submissionFailure, setSubmissionFailure ] = useState("");

  return (
    <React.Fragment>
    <Button variant="outline-success"
      onClick={() => setShowForm(!showForm)}
      aria-controls={`add-query-form-wrapper`}
      aria-expanded={showForm}
      className="add-query-form-toggle"
    >
      <FontAwesomeIcon icon="plus" />
      {"Ask a new question or make a comment!"}
    </Button>
    <Collapse in={showForm}>
      <div className="add-query-form-wrapper">
    <Formik
      initialValues={{queryText: "", private: false}}
      validationSchema={Yup.object({
        queryText: Yup.string().required(),
        private: Yup.boolean()
      })}
      onSubmit={(values, { setSubmitting, resetForm }) => {
        // (event) => action(queryText, showPublic, event)
        DEBUGGING && console.log(values.private);
        DEBUGGING && console.log(!values.private);
        setSubmissionSucceeded(false);
        action(values.queryText, !values.private, setSubmitting,
               setSubmissionFailure, setSubmissionSucceeded);
        resetForm();
        }
      }
    >
      {formik => (!submissionSucceeded ? (
      <Form
        className="add-query-form"
        id="add-query-form"
        onSubmit={formik.handleSubmit}
      >
        {!!singleStep && !!nonStep &&
          <Alert variant="warning" className="left-icon"><FontAwesomeIcon icon="question-circle" size="2x" /> You are asking a general question, not linked to your current step. To ask about the current step, select 'This Step' above.</Alert>
        }
        {!!singleStep && !nonStep &&
          <Alert variant="warning" className="left-icon"><FontAwesomeIcon icon="shoe-prints" size="2x" /> You are asking a question linked to your current step. To ask a general question, select "General" above.</Alert>
        }
        {(!nonStep && !!singleStep) &&
            !!answer && answer !== "null" ?
            <Form.Group controlId="newQueryFormAnswer"
              className="alert alert-info"
            >
              <React.Fragment>
                <Form.Label>You said</Form.Label>
                <Alert variant="light">{answer}</Alert>
                <Form.Label>and that was counted for {score} {score===1 ? "point" : (score===0 ? "points" : "of a point")}</Form.Label>
              </React.Fragment>
            </Form.Group>
            :
              ""
        }
        <Row>
          <Form.Group controlId="newQueryFormTextarea" as={Col}>
            <Form.Label>Your question or comment</Form.Label>
            <Form.Control as="textarea"
              name="queryText"
              rows="3"
              placeholder="Type your question or comment here."
              {...formik.getFieldProps("queryText")}
              className={formik.touched.queryText && formik.errors.queryText ? "error" : null}
            />
            <FormErrorMessage component="span" name="queryText" />
          </Form.Group>
        </Row>

        <Row>
          <Form.Group controlId={`addQueryPrivateCheckbox`} as={Col}>
            <Form.Check name="private"
              type="checkbox"
              label="Keep this question or comment private."
              checked={formik.values.private}
              {...formik.getFieldProps("private")}
              />
          </Form.Group>
        </Row>
        <Row>
          <Col>
            <Button variant="primary" type="submit"
              disabled={!!formik.isSubmitting ? true : false}
            >
              {!formik.isSubmitting ? <FontAwesomeIcon icon="comment" /> : <Spinner animation="grow" size="sm" />} Submit my query
            </Button>
          </Col>
        </Row>
        {!!submissionFailure &&
          <Row>
            <Col>
              <Alert variant="danger" className="error-message row">
                <Col xs="auto">
                  <FontAwesomeIcon size="2x" icon="exclamation-triangle" />
                </Col>
                <Col xs="10">
                  {submissionFailure}
                </Col>
              </Alert>
            </Col>
          </Row>
        }
      </Form>)
      : (<>
      <div className="add-query-result-div add-query-form">
        <Row>
          <Col>Success!!</Col>
        </Row>
        <Row className="new-query-result-another-button">
          <Col>
            <Button color="primary"
              onClick={() => {
                setSubmissionSucceeded(false);
                formik.values.queryText = "";
              }}>
              <FontAwesomeIcon icon="redo-alt" /> Submit another query
            </Button>
          </Col>
        </Row>
      </div>
      </>
      ))}
      </Formik>
      </div>
    </Collapse>
    </React.Fragment>
  );
}

const AddChildForm = ({level, classId, queryId, replyId=null,
                       addChildAction, setShowAdder, scope
                      }) => {
  // FIXME: Handling legacy data here
  if ( level==="reply" && replyId===undefined ) { replyId="null" };
  const [childText, setChildText] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const uid = [classId, queryId, replyId].join("_");
  const createChild = e => {
    e.preventDefault();
    addChildAction({replyId: replyId, queryId: queryId,
                    opText: childText,
                    showPublic: !isPrivate,
                    scope: scope
                    });
    setShowAdder(false);
  }
  return (
    <Form id={`add-child-form-${uid}`}
      className={`add-child-form add-${level}-form`}
    >
      <Form.Group controlId={`addChildPrivateCheckbox-${uid}`}>
        <Form.Check type="checkbox"
          label={`Keep my ${level} private`}
          defaultValue={isPrivate}
          onChange={e => setIsPrivate(e.target.value)}
        />
      </Form.Group>
      <Form.Group controlId={`addChildTextarea-${uid}`}>
        <TextareaAutosize
          onChange={e => setChildText(e.target.value)}
        />
      </Form.Group>
      <Button variant="primary" type="submit"
        onClick={e => createChild(e)}
      >
        Submit {level}
      </Button>
    </Form>
  )
}

const DisplayRow = ({level, newReplyAction, newCommentAction,
                     updateReplyAction, updateCommentAction, updateQueryAction, setReadStatusAction,
                     viewingAsAdmin, viewingAsInstructor,
                     queryId, opId, opNameFirst, opNameLast, opRole,
                     dateSubmitted, dateUpdated, opText,
                     hidden, showPublic, flagged, deleted,
                     popularity, helpfulness, pinned, read,
                     classId=null, replyId=null, commentId=null,
                     queryStatus=null, opResponseText=null, stepPrompt=null,
                     sampleAnswers=null,
                     queryStep=null, queryPath=null,
                     score=null, adjustedScore=null,
                     children=null, threadIndex=0, scope
                    }) => {
  // DEBUGGING && console.log('starting display row');
  const myRoles = !!opRole && opRole != null ?
    opRole.map(r => `${r}`).join(" ") : "";
  const readClass = read===true ? "read" : (read===false ? "unread" : "");
  const {user, } = useContext(UserContext);
  const [ showAdder, setShowAdder ] = useState(false);
  const [ editing, setEditing ] = useState(false);
  const [ isPublic, setIsPublic ] = useState(showPublic);
  const [ myStatus, setMyStatus ] = useState(queryStatus);
  const [ myScore, setMyScore ] = useState(
    adjustedScore!=null ? adjustedScore : score)

  const showEditingForm = (e) => {
    e.preventDefault();
    setEditing(true);
  }

  let SampleList;
  if ( !!sampleAnswers ) {
    let sampleAnswerList = sampleAnswers.split("|");
    SampleList = <ul>{sampleAnswerList.map((a, i) => <li key={`${a}_${i}`}>{a}</li>)}</ul>
  }
  const uid = [classId, queryId, replyId, commentId].join('_');
  const levels = ["query", "reply", "comment"];
  const childLevel = levels[levels.indexOf(level) + 1];
  const iconSize = level==="query" ? "3x" : "1x";
  const queryStatusList = ["",
                           "confirmed",
                           "fixed",
                           "not_a_bug",
                           "duplicate",
                           "awaiting_review",
                           "allowance_given",
                           "question_answered"];
  const queryStatusIcons = {placeholder: "",
                           confirmed: "exclamation-circle",
                           fixed: "thumbs-up",
                           not_a_bug: "circle",
                           duplicate: "copy",
                           awaiting_review: "question-circle",
                           allowance_given: "hand-holding-heart",
                           question_answered: "check-circle"};
  const queryStatusVariants = {placeholder: "",
                               confirmed: "success",
                               fixed: "success",
                               not_a_bug: "warning",
                               duplicate: "warning",
                               awaiting_review: "secondary",
                               allowance_given: "warning",
                               question_answered: "info"};
  const updateArgs = {query: {pathId: queryPath, stepId: queryStep,
                              opId: opId, userId: user.userId, queryId: queryId,
                              scope: scope
                             },
                      reply: {opId: opId, userId: user.userId, replyId: replyId,
                              queryId: queryId, scope: scope},
                      comment: {opId: opId, userId: user.userId,
                                commentId: commentId,
                                replyId: replyId, queryId: queryId, scope: scope}
  };
  const idArgs = updateArgs[level];  // for building unique keys
  idArgs['classId'] = classId;
  const idString = Object.values(idArgs).join("-");
  const updateThisAction = {query: updateQueryAction,
                            reply: updateReplyAction,
                            comment: updateCommentAction
  };
  const addChildAction = {query: newReplyAction,
                          reply: newCommentAction,
                          comment: null
  };
  const togglePublic = () => {
    updateThisAction[level]({showPublic: !isPublic, ...updateArgs[level]});
    setIsPublic(!isPublic);
  };
  const toggleRead = () => {
    let myIds = {query: queryId,
                 reply: replyId,
                 comment: commentId}
    setReadStatusAction({postLevel: level,
                         postId: myIds[level],
                         userId: user.userId,
                         readStatus: !read,
                         scope: scope});
  }

  const sendUpdate = e => {
    e.preventDefault();
    updateThisAction[level]({...idArgs,
                             score: parseFloat(myScore),
                             queryStatus: myStatus});
  }

  return (
    <li key={`${uid}-display-row`}
      className={`${level}-display-row`}
    >

    <Form id={`update-${level}-form-${idString}`}
      className={`update-${level}-form update-form`}
      inline="true"
      onSubmit={sendUpdate}
    >
      <Row className={`${level}-display-wrapper display-wrapper ${readClass} ${myRoles}`} >
        <Col xs={3} className={`${level}-display-op display-op`}>
          <span className={`${level}-display-op-name display-op-name`}>
            {`${opNameFirst} ${opNameLast}`}
          </span><br />
          {level!=="comment" ?
            <FontAwesomeIcon icon="user-circle" size={iconSize}
              className="display-op-avatar"
            /> : ""
          }
          {!!opRole && opRole.map(r =>
            <RoleIcon className={`role-icon ${r}`}
              key={`${uid}-${r}`} icon={r}
            />
          )}
          <br />
          {/* {level==="query" &&
            <React.Fragment>
            <span className={`${level}-display-op-date display-op-date`}>
              {readableDateAndTime(dateSubmitted)}
            </span><br />
            </React.Fragment>
          } */}
          {!!queryStatus ? (
            (!!viewingAsAdmin || !!viewingAsInstructor) ?


            <Form.Group controlId={`update-${level}-queryStatus-input-${idString}`}>
              <FormControl
                as="select"
                defaultValue={parseInt(myStatus)}
                // currentText={DOMPurify.sanitize(queryStatus)}
                onChange={e => setMyStatus(e.target.value)}
                size="sm"
              >
                {queryStatusList.map((label, index) =>
                    <option value={index} key={label}
                      // selected={index===parseInt(currentText) ? "selected" : false}
                    >
                      {label.replace("_", " ")}
                    </option>
                 )}
              </FormControl>
            </Form.Group>
            : <Badge pill
                bg={queryStatusVariants[queryStatusList[queryStatus]]}
                className={`${level}-display-op-status display-op-status`}
              >
                <FontAwesomeIcon size="sm"
                  icon={queryStatusIcons[queryStatusList[queryStatus]]}
                />
              {queryStatusList[queryStatus].replace("_", " ")}
              </Badge>
            )
            : ""
          }
          {level==="query" &&
           (user.userId===opId || !!viewingAsAdmin || !!viewingAsInstructor) &&
            score !== null &&
            <div className={`${level}-display-op-privateinfo display-op-privateinfo instructor-view`}>
              {(!!viewingAsAdmin || !!viewingAsInstructor) ?
                <span className={`${level}-display-op-points display-op-points`}>
                  <Form.Group>
                    <FormLabel>score</FormLabel>
                    <FormControl
                      as="input"
                      defaultValue={myScore}
                      onChange={e => setMyScore(e.target.value)}
                      size="sm"
                    />
                  </Form.Group>
                  {!!adjustedScore && `(previously ${score})`}
                </span>
              :
                <span className={`${level}-display-op-points display-op-points badge`}>
                  {!!adjustedScore ? `${adjustedScore} point(s) (was ${score})`: `${score} point(s)`}
                </span>
              }
              <span className={`${level}-display-op-privatemessage display-op-privatemessage`}>
                <FontAwesomeIcon icon="eye-slash" />
                this score is private
              </span>
            </div>
          }
          {level==="query" &&
            (user.userId===opId || !!viewingAsAdmin || !!viewingAsInstructor) &&
            <Button variant="primary"
              type="submit"
            >Update Query</Button>
          }
          {user.userId===opId ?
            <Button className={`${level}-display-op-public display-op-public`}
              onClick={togglePublic}
              variant="link"
            >
                <FontAwesomeIcon icon={!!isPublic ? "eye" : "eye-slash"}
                  size="1x" />
                {!!isPublic ? "public" : "private"}
            </Button>
            :
            <span className={`${level}-display-op-public display-op-public`} >
                <FontAwesomeIcon icon={!!isPublic ? "eye" : "eye-slash"}
                  size="1x" />
                {!!isPublic ? "public" : "private"}
            </span>
          }
        </Col>
        <Col xs={9}
          className={`${level}-display-body-wrapper ${readClass}  display-body-wrapper`}
        >
          {!!user.userLoggedIn &&
            <Button onClick={toggleRead}
              size="sm" variant="link" className="read-link"
            >
              <FontAwesomeIcon size="sm"
                icon={!!read ? "envelope-open" : "envelope" } />
              Mark as {!!read ? `unread` : `read`}
            </Button>
          }
          <div className={`${level}-display-inner-wrapper ${readClass} display-inner-wrapper`}>
          {!!queryStep &&
            <React.Fragment>
              The step asked...
              <p className="query-display-prompt"
                // FIXME: do I need sanitize in all the places it's commented out?
                // dangerouslySetInnerHTML={{
                //   __html: !!stepPrompt ? DOMPurify.sanitize(marked(stepPrompt)) : ""}}
                dangerouslySetInnerHTML={{
                  __html: !!stepPrompt ? marked(stepPrompt) : ""}}
              />
            </React.Fragment>
          }
          {!!opResponseText &&
            <React.Fragment>
              And I responded...
              <p className="query-display-response"
                // dangerouslySetInnerHTML={{
                  // __html: !!opResponseText ? DOMPurify.sanitize(marked(opResponseText)) : ""}}
                dangerouslySetInnerHTML={{
                  __html: !!opResponseText ? marked(opResponseText) : ""}}
              />
            </React.Fragment>
          }
          {!!sampleAnswers &&
            <React.Fragment>
              Good answers could include these...
              <div className="query-display-samples">{SampleList}</div>
            </React.Fragment>
          }
          <SwitchTransition>
            <CSSTransition
              key={!!editing ? `${level}-display-body-editor` : `${level}-display-body-text`}
              classNames={`${level}-display-body-text`}
              unmountOnExit={false}
              timeout={200}
            >
              {!!editing ?
                <div className={`${level}-display-body-text display-body-text`}>
                  <UpdateForm level={level}
                    idArgs={idArgs}
                    updateAction={updateThisAction[level]}
                    // currentText={opText ? DOMPurify.sanitize(opText) : ""}
                    currentText={opText ? opText : ""}
                    setEditingAction={setEditing}
                  />
                </div>
                :
                <React.Fragment>
                <div className={`${level}-display-body-text display-body-text`}>
                  <p className={`${level}-display-op-question display-op-question`}
                    // dangerouslySetInnerHTML={{
                    //   __html: opText ? DOMPurify.sanitize(marked(opText)) : ""}}
                    dangerouslySetInnerHTML={{
                      __html: opText ? marked(opText) : ""}}
                  />
                </div>
                <span className={`${level}-display-date display-date`}>
                  <FontAwesomeIcon icon="clock" size="sm" />{readableDateAndTime(dateSubmitted)}
                </span>
                {!!dateUpdated && (dateUpdated !== dateSubmitted) &&
                  <span className={`${level}-display-edited-date display-edited-date`}>
                    <FontAwesomeIcon icon="clock" size="sm" />
                    last edited {readableDateAndTime(dateUpdated)}
                  </span>
                }
                {!!queryStep && (!!viewingAsAdmin || !!viewingAsInstructor) &&
                  <span className={`${level}-display-query-step dispay-query-step`}>
                    <FontAwesomeIcon icon="shoe-prints" size="sm" />
                    for step {queryStep} in path {queryPath}
                  </span>
                }
                <ControlRow
                  userId={user.userId}
                  opId={opId}
                  level={level}
                  classId={classId}
                  icon={level==="comment" ? null : childLevel}
                  showAdderValue={level==="comment" ? null : showAdder}
                  showAdderAction={(level==="comment" || !user.userLoggedIn) ? null : setShowAdder}
                  showEditorAction={showEditingForm}
                  updateAction={updateThisAction[level]}
                  defaultUpdateArgs={updateArgs[level]}
                  userRoles={user.userRoles}
                  instructing={user.instructing}
                  showPublic={showPublic}
                  flagged={flagged}
                  pinned={pinned}
                  popularity={popularity}
                  helpfulness={helpfulness}
                  userLoggedIn={user.userLoggedIn}
                />
                </React.Fragment>
              }
              </CSSTransition>
              </SwitchTransition>
              </div>
            </Col>
          </Row>

    </Form>
          {level !== "comment" && !!user.userLoggedIn &&
            <span className={`${level}-display-add-child display-add-child`}>
              {/* <a className="label"
                onClick={() => setShowAdder(!showAdder)}
                aria-controls={`${uid}-add-child-form-wrapper`}
                aria-expanded={showAdder}
              >
                <FontAwesomeIcon icon={childLevel} />{childLevel.toUpperCase()}
              </a> */}
              <Collapse in={showAdder}>
                <div className={`${uid}-add-child-form-wrapper add-child-form-wrapper`}>
                  <AddChildForm className="add-child-form"
                    level={childLevel}
                    classId={classId}
                    queryId={queryId}
                    replyId={replyId}
                    addChildAction={addChildAction[level]}
                    setShowAdder={setShowAdder}
                    scope={scope}
                  />
                </div>
              </Collapse>
            </span>
          }

          <ul className={`${level}-display-children display-children`}>
          {!!children && children.map(c =>
            <DisplayRow key={`${classId}_${queryId}_${!!replyId ? `${replyId}_${c.commentId}` : c.replyId}`}
              level={childLevel}
              classId={classId}
              queryId={queryId}
              replyId={!!replyId ? replyId : c.replyId}
              commentId={!!replyId ? c.commentId: null}
              {...c}
              updateQueryAction={updateQueryAction}
              newReplyAction={newReplyAction}
              updateReplyAction={updateReplyAction}
              newCommentAction={newCommentAction}
              updateCommentAction={updateCommentAction}
              setReadStatusAction={setReadStatusAction}
              scope={scope}
            />)}
          </ul>

      </li>
    )
}


const QueriesList = ({queries, updateQueryAction, newReplyAction,
                       newCommentAction, updateReplyAction,
                       updateCommentAction, setReadStatusAction, viewingAsAdmin, viewCourse, viewStudents, viewGroup, byClass, scope}) => {
  const { user, } = useContext(UserContext);
  const instructorState = scope==="students" ?
    user.instructing.find(c => c.id === viewGroup) : false;


  return (<>
    {( !!queries && queries!==[] ) ?
          <ul className="query-list">
            {queries.map(
              q => <DisplayRow key={`query-row-${q.queryId}`}
                      level="query"
                      updateQueryAction={updateQueryAction}
                      newReplyAction={newReplyAction}
                      newCommentAction={newCommentAction}
                      updateReplyAction={updateReplyAction}
                      updateCommentAction={updateCommentAction}
                      setReadStatusAction={setReadStatusAction}
                      viewingAsAdmin={viewingAsAdmin}
                      viewingAsInstructor={instructorState}
                      classId={!!byClass ? viewGroup : 0}
                      scope={scope}
                      {...q}
                    />
            )}
          </ul>
    :
    <ul />
    }
  </>)
}

const ScopeView = ({scope, nonStep, singleStep,
                    newQueryAction,
                    updateQueryAction,
                    newReplyAction,
                    updateReplyAction,
                    newCommentAction,
                    updateCommentAction,
                    setReadStatusAction,
                    viewingAsAdmin,
                    viewCourse,
                    viewStudents,
                    myClassmatesCounts,
                    myStudentsCounts,
                    courseChangeFunctions,
                    queries,
                    page,
                    setPage,
                    myCount,
                    loading
                  }) => {


  const {user, } = useContext(UserContext);
  const byClass = ["class", "students"].includes(scope);
  const [viewGroup, setViewGroup] = useState(scope==="class" ? viewCourse :
    (scope==="students" ? viewStudents : null));
  const [currentQueryTotal, setCurrentQueryTotal] = useState();
  const [noGroupsAvailable, setNoGroupsAvailable] = useState(checkForGroupsAvailable());
  DEBUGGING && console.log("in ScopeView: scope is");
  DEBUGGING && console.log(scope);
  DEBUGGING && console.log("in ScopeView: queries is");
  DEBUGGING && console.log(queries);
  DEBUGGING && console.log(queries.length);
  // DEBUGGING && console.log(Object.keys(user.classInfo).length);
  // DEBUGGING && console.log("in ScopeView: user.instructing is");
  // DEBUGGING && console.log(user.instructing);
  // DEBUGGING && console.log(Object.keys(user.instructing).length);


  function checkForGroupsAvailable() {
    let noneAvailable = false;
    if ( scope==="class" &&
        (!user.classInfo || !Object.keys(user.classInfo).length > 0 )) {
      noneAvailable = true;
    } else if (scope==="students" &&
        (!user.instructing || !Object.keys(user.instructing).length > 0 )) {
      noneAvailable = true;
    }
    return noneAvailable;
  }
  let myCourses = scope==="students" ? myStudentsCounts : myClassmatesCounts;

  useEffect(() => {
    if (!!byClass && myCourses.length > 0) {
      let myVal = !!viewGroup ? viewGroup : myCourses[0].id;
      courseChangeFunctions[scope](myVal);
      // DEBUGGING && console.log(`changing course to: ${myVal}`);
    }
  }, [byClass, viewGroup, scope, queries]);

  let classSelectOptions = [];
  let viewGroupLabel = "";
  if ( ['class', 'students'].includes(scope) && !noGroupsAvailable ) {
     classSelectOptions = myCourses.map( c => {
        const myUnreadCounter = c.unread_count > 0 ?
              <Badge bg="success"><FontAwesomeIcon icon="envelope" size="sm" />{c.unread_count}</Badge>
              : "";
        const myQueryCount = c.queries_count || "0";
        // if ( c.id===viewGroup ) {
        //   setCurrentQueryTotal(!!filterUnread ? c.unread_count : myQueryCount);
        // }
        return(
          {value: c.id,
           label: <span>{c.institution}, {c.year}, {c.term}, {c.section}, {c.instructor}&nbsp;&nbsp;
            <Badge bg="secondary">{myQueryCount}</Badge>
            {myUnreadCounter}
           </span>,
           labelText: `${c.institution}, ${c.year}, ${c.term}, ${c.section}, ${c.instructor}`
          }
        )
      }
    )
    const viewGroupItem = ![0, undefined].includes(viewGroup) ? classSelectOptions.filter(o => o.value===viewGroup)[0] : classSelectOptions[0];
    viewGroupLabel = viewGroupItem.labelText;
    viewGroupLabel = viewGroupItem.labelText;
  }

  let myPagerArray = [];
  if ( myCount >= 20 ) {
    myPagerArray = Array.from(Array(Math.ceil(myCount/20)).keys()).map(n => n + 1);
  }
  const myPagerVisibleStart = page > 2 ? page - 3 : 0;
  const myPagerVisibleSubset = myPagerArray.slice(myPagerVisibleStart, myPagerVisibleStart + 5);

  return (
    <>
    <div className="queries-view-pane" key={scope}>
      {!!loading ? <LoadingContent /> :
      <>
      {scope==='user' ? (
        !!user.userLoggedIn ? (
          (nonStep===false && singleStep===false) ?
            <Alert variant="warning" className="me-new-query-info">
              <p>{"Asking a question that's not about a specific path or step? Select 'General' at top."}</p>
              <p>To ask about a specific step you must be attempting that step when you submit your question.</p>
            </Alert>
          :
            <NewQueryForm
              answer={user.currentAnswer}
              score={user.currentScore}
              action={newQueryAction}
              nonStep={nonStep}
              singleStep={singleStep}
            />
        )
        : <Alert variant="warning" className="me-new-query-info queries-view-login-message">
            <Link to="login">Log in</Link> or <Link to="register">sign up</Link> to ask a question or offer a comment.
          </Alert>
      )
      : ''}
      {['class', 'students'].includes(scope) ? (
          !noGroupsAvailable ?
            <Form
                id={`${scope}SelectorForm`}
                className={`${scope}-selector-form`}
            >
                <Select
                  classNamePrefix={`${scope}-selector-form`}
                  options={classSelectOptions}
                  onChange={e => setViewGroup(e.value)}
                  value={viewGroup}
                  defaultValue={viewGroup}
                  placeholder={viewGroupLabel}
                  isSearchable={false}
                />
            </Form>
          :
          <>
          <Alert variant="warning">You aren't part of any course groups.</Alert>
          </>
        )
        :
        ""
      }
      {!!queries.length > 0 ?
        <QueriesList
          queries={queries}
          updateQueryAction={updateQueryAction}
          newReplyAction={newReplyAction}
          updateReplyAction={updateReplyAction}
          newCommentAction={newCommentAction}
          updateCommentAction={updateCommentAction}
          setReadStatusAction={setReadStatusAction}
          viewingAsAdmin={viewingAsAdmin}
          viewCourse={viewCourse}
          viewStudents={viewStudents}
          viewGroup={viewGroup}
          byClass={byClass}
          scope={scope}
        />
        :
        !!user.userLoggedIn &&
          <Alert variant="warning">No {scope!=="students" && scope!=="class" && scope} questions to view {(scope==="students" || scope==="class") && 'for this class'}.</Alert>
      }
      </>
      }
    </div>
    {myPagerArray.length > 1 &&
    <div className="queries-view-pager-wrapper">
      <Pagination className="queries-view-pager">
        <Pagination.First onClick={() => setPage(1)} />
        <Pagination.Prev onClick={() => setPage(page > 1 ? page - 1 : 1)} />
        {myPagerVisibleSubset.map(n =>
          <Pagination.Item key={n} active={n===page}
            onClick={() => setPage(n)}
          >{n}</Pagination.Item>
        )}
        <Pagination.Next onClick={() => setPage(page < myPagerArray.length ? page + 1 : myPagerArray.length)} />
        <Pagination.Last onClick={() => setPage(myPagerArray.length)} />
      </Pagination>
    </div>
    }
    {!!queries && queries.length > 0 &&
      <div className="queries-view-footer">
        Viewing queries {(page * 20) - 19} to {(page * 20) - 19 + (queries.length - 1)} of {myCount} (newest to oldest)
      </div>
    }
    </>
  )
}

const LoadingContent = () => {
  return (
    <Spinner animation="grow" variant="secondary"
      className="align-self-center map-spinner" />
  )
}

const TabCounter = ({loadingCounts, loading, totalCount, unreadCount}) => {
  return (!!loadingCounts || !!loading ?
    <Badge bg="secondary">
      <Spinner animation="grow" size="sm" />
    </Badge>
    :
    <>
    <Badge bg="secondary">{totalCount || "0"}</Badge>
    {!!unreadCount &&
      <Badge bg="success"><FontAwesomeIcon icon="envelope" size="sm" /> {unreadCount}</Badge>
    }
    </>
  )
}

const ScopesFrame = ({viewScope,
                      nonStep,
                      singleStep,
                      viewingAsAdmin,
                      viewCourse,
                      setViewCourse,
                      viewStudents,
                      setViewStudents,
                      myCourses,
                      courseChangeFunctions,
                      queries,
                      userTotalCount,
                      userUnreadCount,
                      classmatesTotalCount,
                      classmatesUnreadCount,
                      myClassmatesCounts,
                      setViewScope,
                      studentsTotalCount,
                      studentsUnreadCount,
                      myStudentsCounts,
                      otherTotalCount,
                      otherUnreadCount,
                      newQueryAction,
                      updateQueryAction,
                      newReplyAction,
                      updateReplyAction,
                      newCommentAction,
                      updateCommentAction,
                      setReadStatusAction,
                      page,
                      setPage,
                      filterUnread,
                      loading,
                      loadingCounts
                      }) => {

  const {user,} = useContext(UserContext);
  const [myCount, setMyCount] = useState(() => getMyCountValue());
  DEBUGGING && console.log('in ScopesFrame:');
  DEBUGGING && console.log('queries are');
  DEBUGGING && console.log(queries);

  function getMyCountValue() {
    let myCountValue = null;
    switch (viewScope) {
      case "user":
        myCountValue = !!filterUnread ? userUnreadCount : userTotalCount;
        break;
      case "class":
        if ( viewCourse !== 0 ) {
          const currentClass = myClassmatesCounts.filter(c => c.id===viewCourse);
          myCountValue = !!filterUnread ? currentClass.queries_count
            : currentClass.unread_count;
        };
        break;
      case "students":
        if ( viewStudents !== 0 ) {
          const currentStudents = myStudentsCounts.filter(c => c.id===viewStudents);
          if ( currentStudents.length !== 0 ) {
            myCountValue = !filterUnread ? currentStudents[0].queries_count
                      : currentStudents[0].unread_count;
          } else {
            myCountValue = 0;
          }
        };
        break;
      case "public":
        myCountValue = !!filterUnread ? otherUnreadCount : otherTotalCount;
        break;
      default:
        myCountValue = 0;
    }
    return myCountValue;
  }

  useEffect(() => {
    setMyCount(() => getMyCountValue());
  }, [viewScope, viewStudents, viewCourse]);

  const handleScopeChange = (newScope) => {
    setViewScope(newScope);
    switch (newScope) {
      case "user":
        setViewStudents(0);
        setViewCourse(0);
        setPage(1);
      case "class":
        setViewStudents(0);
        setPage(1);
        break;
      case "students":
        setViewCourse(0);
        setPage(1);
        break;
      case "public":
        setViewStudents(0);
        setViewCourse(0);
        setPage(1);
        break;
      default:
        setViewStudents(0);
        setViewCourse(0);
        setPage(1);
        break;
    }
  }

  return (
    <React.Fragment>
      <div className="queries-view-changer-wrapper">
        <Button
          className={`queries-view-changer ${viewScope==='user' ? "in" : "out"}`}
          variant="outline-secondary"
          onClick={() => handleScopeChange('user')}
        >
          <FontAwesomeIcon icon="user" />Me
            <TabCounter loadingCounts={loadingCounts} loading={loading}
              totalCount={userTotalCount} unreadCount={userUnreadCount} />
        </Button>
        {!!user.userLoggedIn && !!user.classInfo &&
        <Button
          className={`queries-view-changer ${viewScope==='class' ? "in" : "out"}`}
          variant="outline-secondary"
          onClick={() => handleScopeChange('class')}
        >
          <FontAwesomeIcon icon="users" />Classmates
            <TabCounter loadingCounts={loadingCounts} loading={loading}
              totalCount={classmatesTotalCount} unreadCount={classmatesUnreadCount} />
        </Button>
        }
        {!!user.userRoles.some(v => ["instructors", "administrators"].includes(v)) &&
          <Button
            className={`queries-view-changer ${viewScope==='students' ? "in" : "out"}`}
            variant="outline-secondary"
            onClick={() => handleScopeChange('students')}
          >
            <FontAwesomeIcon icon="users" />Students
            <TabCounter loadingCounts={loadingCounts} loading={loading}
              totalCount={studentsTotalCount} unreadCount={studentsUnreadCount} />
          </Button>
        }
        <Button
          className={`queries-view-changer ${viewScope==='other' ? "in" : "out"}`}
          variant="outline-secondary"
          onClick={() => handleScopeChange('public')}
        >
          <FontAwesomeIcon icon="globe-americas" />Others
            <TabCounter loadingCounts={loadingCounts} loading={loading}
              totalCount={otherTotalCount} unreadCount={otherUnreadCount} />
        </Button>
      </div>
            <SwitchTransition>
              <CSSTransition
                key={viewScope}
                timeout={250}
                classNames="queries-view-pane"
                appear={true}
                mountOnEnter
                unmountOnExit={true}
              >
                <ScopeView
                  scope={viewScope}
                  nonStep={nonStep}
                  singleStep={singleStep}
                  newQueryAction={newQueryAction}
                  updateQueryAction={updateQueryAction}
                  newReplyAction={newReplyAction}
                  updateReplyAction={updateReplyAction}
                  newCommentAction={newCommentAction}
                  updateCommentAction={updateCommentAction}
                  setReadStatusAction={setReadStatusAction}
                  viewingAsAdmin={viewingAsAdmin}
                  viewCourse={viewCourse}
                  viewStudents={viewStudents}
                  myCourses={myCourses}
                  myClassmatesCounts={myClassmatesCounts}
                  myStudentsCounts={myStudentsCounts}
                  courseChangeFunctions ={courseChangeFunctions}
                  queries={queries}
                  page={page}
                  setPage={setPage}
                  myCount={myCount}
                  loading={loading}
                />
              </CSSTransition>
            </SwitchTransition>

{/*
        </CSSTransition> */}
      {/* )} */}

      {/* { ( !userQueries || userQueries == [] ) ? (
        "You haven\'t asked any questions yet about this step."
      ) : (
        <Table>
        </Table>
      )}

      { ( !classQueries || classQueries == {} ) ? (
        "You haven\'t asked any questions yet about this step."
      ) : (
        <Table>
        </Table>
      )}

      { ( !otherQueries || otherQueries == [] ) ? (
        "No one else has asked a question about this step. Why not be the first?"
      ) : (
      )} */}
    </React.Fragment>
  )
}

const _formatCommentData = c => {
  return ({level: "comment",
            replyId: c.bug_post_comments.on_post,
            commentId: c.bug_post_comments.id,
            opId: c.bug_post_comments.commenter,
            opNameFirst: c.auth_user.first_name,
            opNameLast: c.auth_user.last_name,
            opText: c.bug_post_comments.comment_body,
            dateSubmitted: c.bug_post_comments.dt_posted,
            dateUpdated: c.bug_post_comments.modified_on,
            opRole: c.bug_post_comments.commenter_role,
            hidden: c.bug_post_comments.hidden,
            deleted: c.bug_post_comments.deleted,
            flagged: c.bug_post_comments.flagged,
            pinned: c.bug_post_comments.pinned,
            popularity: c.bug_post_comments.popularity,
            helpfulness: c.bug_post_comments.helpfulness,
            showPublic: c.bug_post_comments.public,
            threadIndex: c.bug_post_comments.thread_index,
            read: c.read
          })
}

const _formatReplyData = p => {
  let formattedComments = p.comments.map(c => _formatCommentData(c));
  return ({level: "reply",
            replyId: p.bug_posts.id,
            opId: p.bug_posts.poster,
            opNameFirst: p.auth_user.first_name,
            opNameLast: p.auth_user.last_name,
            opText: p.bug_posts.post_body,
            dateSubmitted: p.bug_posts.dt_posted,
            dateUpdated: p.bug_posts.modified_on,
            opRole: p.bug_posts.poster_role,
            hidden: p.bug_posts.hidden,
            deleted: p.bug_posts.deleted,
            flagged: p.bug_posts.flagged,
            pinned: p.bug_posts.pinned,
            popularity: 0,
            helpfulness: 0,
            showPublic: p.bug_posts.public,
            threadIndex: p.bug_posts.thread_index,
            read: p.read,
            children: formattedComments
          }
  )
}

const _formatQueryData = q => {
  let formattedReplies = q.posts.map(p => _formatReplyData(p));
  if ( !!q.bugs.admin_comment ) {
    formattedReplies.unshift({
      level: "reply",
      replyId: undefined,
      opId: 19,
      opNameFirst: "Ian",
      opNameLast: "Scott",
      opText: q.bugs.admin_comment,
      sampleAnswers: q.bugs.sample_answers,
      dateSubmitted: q.bugs.date_submitted,
      dateUpdated: q.bugs.modified_on,
      opRole: ["administrators", "instructors"],
      hidden: false,
      deleted: false,
      flagged: false,
      pinned: false,
      popularity: 0,
      helpfulness: 0,
      showPublic: true,
      threadIndex: 0,
      children: [],
      score: q.bugs.score,
      adjustedScore: q.bugs.adjusted_score,
      read: false
    });
  }
  let myPrompt = q.bugs.prompt;
  if ( !!q.bugs.step_options && q.bugs.step_options.length ) {
    const optString = q.bugs.step_options.join("\n- ");
    myPrompt = `${myPrompt}\n\n- ${optString}`;
  }
  return ({level: "query",
            queryId: q.bugs.id,
            opId: q.auth_user.id,
            opNameFirst: q.auth_user.first_name,
            opNameLast: q.auth_user.last_name,
            children: formattedReplies,
            dateSubmitted: q.bugs.date_submitted,
            dateUpdated: q.bugs.modified_on,
            queryStatus: q.bugs.bug_status,
            opResponseText: q.bugs.user_response,
            opText: q.bugs.user_comment,
            sampleAnswers: q.bugs.sample_answers,
            stepPrompt: myPrompt,
            hidden: q.bugs.hidden,
            showPublic: q.bugs.public,
            flagged: q.bugs.flagged,
            deleted: q.bugs.deleted,
            pinned: q.bugs.pinned,
            helpfulness: q.bugs.helpfulness,
            popularity: q.bugs.popularity,
            queryStep: q.bugs.step,
            queryPath: q.bugs.in_path,
            score: q.bugs.score,
            adjustedScore: q.bugs.adjusted_score,
            read: q.read
          }
  )
}

/**
 * finds and updates a query/reply/comment in a list in React state
 *
 * DOES NOT create new query if specified doesn't exist
 * DOES create new post if specified doesn't exist
 * if the new query has deleted: true it is removed
 *
 * @param   {array}  mylist   the list of queries in Reacts state
 * @param   {*}      newItem  the query/reply/comment to be updated
 * @param   {string} itemLevel the name of the item type ("query", "reply"
 *                             or "comment")
 * @param   {number} queryId
 * @return  {array} returns the modified version of the supplied query list
 */
const _findAndUpdateItem = (mylist, newItem, itemLevel, queryId=0) => {
  // TODO: mark children read when marked read
  // DEBUGGING && console.log("_findAndUpdateItem-------------------------------------");
  const dbTableFields = {'query': 'bugs',
                          'reply': 'bug_posts',
                          'comment': 'bug_post_comments'}
  const itemTableField = dbTableFields[itemLevel];
  const markingRead = !!newItem[itemTableField] ? false : true;
  const deleting = !!markingRead ? false
    : newItem[itemTableField].deleted;

  const myItemId = !!markingRead ? newItem.read_item_id
    : newItem[itemTableField].id;

  let myQueryId = myItemId;
  let myReplyId = 0;
  let myCommentId = 0;
  if ( itemLevel==='reply' ) {
    myQueryId = !!markingRead ? newItem.on_bug
      : newItem[itemTableField].on_bug;
    myReplyId = myItemId;
  } else if ( itemLevel ==='comment' ) {
    myQueryId = !!markingRead ? newItem.on_bug : queryId;
    myReplyId = !!markingRead ? newItem.on_bug_post : newItem[itemTableField].on_post;
    myCommentId = myItemId;
  }
  // DEBUGGING && console.log(`myQueryId: ${myQueryId}`);
  const queryIndex = mylist.findIndex(q => q.queryId===myQueryId);
  // DEBUGGING && console.log(`queryIndex: ${queryIndex}`);

  const _innerFindAndUpdate = (i_itemIndex, i_itemlist, formatAction, i_newItem
                        ) => {
    // DEBUGGING && console.log("inner find and update..........");
    // DEBUGGING && console.log(i_itemIndex);
    // DEBUGGING && console.log(i_itemlist);
    // DEBUGGING && console.log(`markingRead: ${markingRead}`);
    if ( !!markingRead ) {
      i_itemlist[i_itemIndex].read = i_newItem.read_status;
    } else if ( !!deleting ) {
      i_itemlist.splice(i_itemIndex, 1);
    } else {
      i_itemlist[i_itemIndex] = formatAction(i_newItem);
    }
    // DEBUGGING && console.log("returning from inner:");
    // DEBUGGING && console.log(i_itemlist);
    return i_itemlist
  }

  const _markChildrenRead = (i_mylist, myIndex) => {
    // DEBUGGING && console.log("marking children read********");
    // DEBUGGING && console.log(i_mylist);
    // DEBUGGING && console.log(myIndex);
    let myReplyList = i_mylist[myIndex].children;
    for (let i=0; i<myReplyList.length; i++) {
      if ( myReplyList[i].read===false ) {
        // DEBUGGING && console.log("marking item");
        // DEBUGGING && console.log(i);
        myReplyList = _innerFindAndUpdate(i, myReplyList, _formatReplyData,
                                  {read_status: true})
        if ( myReplyList[i].hasOwnProperty('children') &&
            myReplyList[i].children !== undefined &&
            myReplyList[i].children.length>0 )
          {
          // DEBUGGING && console.log("marking grandchildren read below========");
          let myCommentList = myReplyList[i].children;
          for (let x=0; x<myCommentList.length; x++) {
            if ( myCommentList[x].read===false ) {
              // DEBUGGING && console.log(myCommentList);
              // DEBUGGING && console.log(x);
              myCommentList = _innerFindAndUpdate(x,
                myCommentList, _formatCommentData, {read_status: true})
              // DEBUGGING && console.log("grandchild result");
              // DEBUGGING && console.log(myCommentList);
            }
          }
          myReplyList[i].children = myCommentList;
        }
        i_mylist[myIndex].children = myReplyList;
      }
    }
    return i_mylist;
  }

  if ( queryIndex > -1 ) {
    // DEBUGGING && console.log(`updating at query level ${itemLevel}`);
    // update at query level
    if (itemLevel==='query') {
      mylist = _innerFindAndUpdate(queryIndex, mylist, _formatQueryData, newItem);
      if ( !!markingRead && newItem.read_status===true) {
        mylist = _markChildrenRead(mylist, queryIndex);
        // DEBUGGING && console.log('returned from marking children read======');
        // DEBUGGING && console.log(mylist);
      }
    } else {
      // update either reply or comment level...
      let myReplyList = mylist[queryIndex].children;
      // DEBUGGING && console.log(`myReplyList:`);
      // DEBUGGING && console.log(JSON.parse(JSON.stringify(myReplyList)));
      // DEBUGGING && console.log(myReplyList.findIndex(p => p.replyId===3));
      // DEBUGGING && console.log(myReplyList.findIndex(p => p.replyId > 333));
      const replyIndex = myReplyList.findIndex(p => p.replyId===myReplyId);
      // DEBUGGING && console.log(`rplyId:`);
      // DEBUGGING && console.log(myReplyId);
      // DEBUGGING && console.log(`rplyIndex: ${replyIndex}`);
      // DEBUGGING && console.log(JSON.parse(JSON.stringify(replyIndex)));
      if (replyIndex > -1) {
        // DEBUGGING && console.log('Got a good index!!!!!!!!');
        if ( itemLevel==='reply') {
          // update at reply level
          mylist[queryIndex].children = _innerFindAndUpdate(replyIndex,
                                                      myReplyList,
                                                      _formatReplyData, newItem);
          if ( !!markingRead && newItem.read_status===false ) {
            mylist = _innerFindAndUpdate(queryIndex, mylist, _formatQueryData,
                                  {read_status: false});
          } else if ( !!markingRead && newItem.read_status===true ) {
            mylist[queryIndex].children = _markChildrenRead(
              mylist[queryIndex].children, replyIndex);
          }
        } else {
          // update at comment level
          const commentIndex = mylist[queryIndex].children[replyIndex]
            .children.findIndex(p => p.commentId===myCommentId);
          if ( commentIndex > -1 ) {
            let myCommentList = mylist[queryIndex].children[replyIndex]
              .children;
            mylist[queryIndex].children[replyIndex]
              .children = _innerFindAndUpdate(commentIndex, myCommentList,
                                        _formatCommentData, newItem);

            if ( !!markingRead && newItem.read_status===false ) {
              mylist = _innerFindAndUpdate(queryIndex, mylist, _formatQueryData,
                                    {read_status: false});
              mylist[queryIndex].children = _innerFindAndUpdate(replyIndex,
                myReplyList, _formatReplyData, {read_status: false});
            }
          } else {
            // or create comment
            mylist[queryIndex].children[replyIndex].children
              .push(_formatCommentData(newItem));
          }
        }
      } else {
        // or create reply
        mylist[queryIndex].children.push(_formatReplyData(newItem));
      }
    }
  }
  return mylist;
}


/**
 * Update state with one query/reply/comment
 *
 * expects myresponse to have keys "auth_user", "bugs", and "posts"
 *
 * @param {object} newItem    the query/reply/comment to update
 * @param {string} itemLevel  the level of the updating item ("query", "reply",
 *                            "comment")
 * @param {number} queryId
 * @param {string} scope
 * @param {object[]}  queries    the array of queries to be updated
 * @param {function} setQueries  function to update queries array in React state
 * @param {function} _setCounts  function to update the counts for various query
 *                               categories in state
 * @return {undefined} (non-returning)
 */
const _updateItemInState = (newItem, itemLevel, queryId, scope, queries,
                            setQueries, _setCounts) => {

  DEBUGGING && console.log("starting _updateItemInState &&&&&&&&&&&&&&&&&");
  DEBUGGING && console.log("queries");
  DEBUGGING && console.log(queries);
  DEBUGGING && console.log("setQueries");
  DEBUGGING && console.log(setQueries);
  const extraArg = itemLevel==="comment" ? [queryId] : [];

  const innerUpdate = (qList, updateAction) => {
    return new Promise((resolve, reject) => {
      DEBUGGING && console.log("innerUpdate: qList");
      DEBUGGING && console.log(qList);
      let newQList = [];
      if ( qList.length && !!qList[0].classId ) {
        newQList = qList.map(myClass => {
          myClass.queries = _findAndUpdateItem(myClass.queries, newItem,
                                                itemLevel, ...extraArg);
          return myClass;
        })
      } else if ( qList.length ) {
        // DEBUGGING && console.log(`updating ${itemLevel}`);
        newQList = _findAndUpdateItem(qList, newItem, itemLevel,
                                      ...extraArg);
        // DEBUGGING && console.log('inner_update*********************');
        // DEBUGGING && console.log(newQList);
      }
      // DEBUGGING && console.log("innerUpdate: newQList");
      // DEBUGGING && console.log(newQList);
      // DEBUGGING && console.log(`sending to:`);
      // DEBUGGING && console.log(updateAction);
      updateAction(newQList);
      resolve(newQList);
    })
  }

  let levelLabel = itemLevel==="query" ? "querie" : itemLevel;
  const scopeLabel = `${scope}_${levelLabel}s`;
  let myPromise = innerUpdate([ ...queries ],
                              setQueries);
  myPromise.then(
    result => {
      _setCounts({[scope]: result});
    },
    result => {
      DEBUGGING && console.log('I broke!!!!!!!!!!!');
      DEBUGGING && console.log(result);
      DEBUGGING && console.log(scopeLabel);
    }
  )
}

/**
 * A React component to render the queries interface
 *
 * expects no parameters
 *
 * @returns React component to render the queries interface
 */
const QueriesView = () => {

    const {user, dispatch} = useContext(UserContext);
    const history = useHistory();
    const [queries, setQueries] = useState([]);
    const [userTotalCount, setUserTotalCount] = useState(null);
    const [userUnreadCount, setUserUnreadCount] = useState(null);
    const [studentsTotalCount, setStudentsTotalCount] = useState(null);
    const [studentsUnreadCount, setStudentsUnreadCount] = useState(null);
    const [myStudentsCounts, setMyStudentsCounts] = useState([]);
    const [classmatesTotalCount, setClassmatesTotalCount] = useState(null);
    const [classmatesUnreadCount, setClassmatesUnreadCount] = useState(null);
    const [myClassmatesCounts, setMyClassmatesCounts] = useState([]);
    const [otherTotalCount, setOtherTotalCount] = useState(null);
    const [otherUnreadCount, setOtherUnreadCount] = useState(null);
    const [page, setPage] = useState(1);
    DEBUGGING && console.log("QueriesView top----------------------");
    DEBUGGING && console.log("queries");
    DEBUGGING && console.log(queries);

    const [loading, setLoading] = useState(!queries ? true : false);
    const [loadingCounts, setLoadingCounts] = useState(false);

    const location = useLocation();
    const urlParams = useParams();
    const pathArray = location.pathname.split('/');
    const [onStep, setOnStep] = useState(pathArray[2]==="walk" &&
      !["map", undefined].includes(urlParams.walkPage) &&
      !!user.currentStep);

    const [singleStep, setSingleStep] = useState(!onStep ? false : true);
    const [nonStep, setNonStep] = useState(true);
    const [viewScope, setViewScope] = useState('public');
    const [viewCourse, setViewCourse] = useState(0);
    const [viewStudents, setViewStudents] = useState(0);
    const setViewCourseWrapped = (val) => {setViewCourse(val);};
    const setViewStudentsWrapped = (val) => {setViewStudents(val);};
    const courseChangeFunctions = {class: setViewCourseWrapped,
                                  students: setViewStudentsWrapped};
    const [filterUnanswered, setFilterUnanswered] = useState(false);
    const [filterUnread, setFilterUnread] = useState(false);
    const [viewingAsAdmin, ] = useState(
      user.userRoles.includes("administrators"));
    DEBUGGING && console.log("viewScope");
    DEBUGGING && console.log(viewScope);

    const setScopeSingleStep = () => {
      setLoading(true);
      setNonStep(false);
      setSingleStep(true);
    }

    const setScopeAllSteps = () => {
      setLoading(false);
      setNonStep(false);
      setSingleStep(false)
    }

    const setScopeGeneral = () => {
      setLoading(true);
      setNonStep(true);
    }

    useEffect(() => {
      let amOnStep = pathArray[2]==="walk" &&
                      !["map", undefined].includes(urlParams.walkPage) &&
                      !!user.currentStep;
      setOnStep(amOnStep);
      if (!nonStep) {
        !!amOnStep ? setScopeSingleStep() : setScopeAllSteps();
      }
    }, [location]);


    // expects four lists of queries in internal formatted form (not raw server response)
    const _setCounts = ({user_queries=null, other_queries=null,
                         class_queries=null, students_queries=null}) => {

      fetchQueriesMetadataAction({thenFetchQueries: false});

    }

    const fetchViewQueriesAction = () => {
      setLoading(true);
      if ( (viewScope==="class" && viewCourse===0) ||
           (viewScope==="students" && viewStudents===0)
         ) {
        setQueries({});
        setLoading(false);
      } else {
        getViewQueries({step_id: !!singleStep && !!onStep ? user.currentStep : 0,
                    user_id: user.userId,
                    nonstep: nonStep,
                    unread: filterUnread,
                    unanswered: filterUnanswered,
                    pagesize: 20,
                    page: page,
                    orderby: "modified_on",
                    classmates_course: viewCourse,
                    students_course: viewStudents,
                    own_queries: viewScope==="user" ? true : false
                  })
        .then(queryfetch => {
          const formatted_queries = queryfetch.map( q => _formatQueryData(q));
          setQueries(formatted_queries);
          setLoading(false);
        });
      }
    }

    const firstRender = useRef(true);
    useEffect(() => {
        if ( firstRender.current ) {
          firstRender.current = false;
          return;
        }
        fetchViewQueriesAction();
      },
      [viewScope, viewCourse, viewStudents, page]
    );

    const fetchQueriesMetadataAction = ({thenFetchQueries=true}) => {
      setLoadingCounts(true);
      getQueriesMetadata({
                  step_id: !!singleStep && !!onStep ? user.currentStep : 0,
                  user_id: user.userId,
                  nonstep: nonStep,
                  unanswered: filterUnanswered,
                })
      .then(queryfetch => {
        setStudentsTotalCount(queryfetch.students_total_count);
        setStudentsUnreadCount(queryfetch.students_unread_count);
        setMyStudentsCounts(queryfetch.students_counts);
        setUserTotalCount(queryfetch.user_query_count);
        setUserUnreadCount(queryfetch.user_unread_count);
        setClassmatesTotalCount(queryfetch.classmates_total_count);
        setClassmatesUnreadCount(queryfetch.classmates_unread_count);
        setMyClassmatesCounts(queryfetch.classmates_counts)
        setOtherTotalCount(queryfetch.other_queries_count);
        setOtherUnreadCount(queryfetch.other_unread_count);
        !!thenFetchQueries && fetchViewQueriesAction();
        setLoadingCounts(false);
      });
    }

    useEffect(() => fetchQueriesMetadataAction({thenFetchQueries: true}),
      [user.currentStep, filterUnread, filterUnanswered, singleStep, nonStep]); // removed onStep,  as triggers

    const newQueryAction = (myComment, showPublic, setSubmitting,
      setSubmissionFailure, setSubmissionSucceeded) => {
      // event.preventDefault();
      const myscore = !['null', undefined].includes(user.currentScore) ?
        user.currentScore : null;
      let queryArgs = {step_id: user.currentStep,
                       path_id: user.currentPath,
                       user_id: user.userId,
                       loc_name: user.currentLocation,
                       answer: user.currentAnswer,
                       log_id: user.currentLogID,
                       score: myscore,
                       user_comment: myComment,
                       show_public: showPublic,
                       item_level: "query"}
      if ( !singleStep || !!nonStep ) {
        queryArgs = {...queryArgs,
                     step_id: null,
                     path_id: null,
                     answer: null,
                     score: null,
                     }
      }
      const otherActions = (setSubmitting) => {
        return(
          {
          missingRequestDataAction: (data) => {
            setSubmitting(false);
            setSubmissionSucceeded(false);
            setSubmissionFailure(`Missing information. Cannot send the message without filling the ${data.error.missing.replace("_", " ")} field.`);
          },
          badRequestDataAction: null, // bad endpoint
          insufficientPrivilegesAction: () => {
            setSubmitting(false);
            setSubmissionSucceeded(false);
            // setSubmissionFailure("Recaptcha check failed. Your message was not sent.")
          },  // failed recaptcha
          serverErrorAction: () => {
            setSubmitting(false);
            setSubmissionSucceeded(false);
            setSubmissionFailure("Something went wrong and your query was not submitted.")
          }
          }
        )
      };

      addQuery(queryArgs)
      .then(messageResponse => {
        returnStatusCheck(messageResponse, history,
          (mydata) => {
            DEBUGGING && console.log(mydata);
            setSubmitting(false);
            setSubmissionSucceeded(true);
            setQueries(mydata.queries.map(
              q => _formatQueryData(q)
            ));
          },
          dispatch,
          otherActions(setSubmitting)
        )
      })
    }

    const setReadStatusAction = ({postLevel,
                                  userId,
                                  postId,
                                  readStatus,
                                  scope}) => {
      updateReadStatus({postLevel: postLevel,
                        userId: userId,
                        postId: postId,
                        readStatus: readStatus})
      .then(myresponse => {
          if (myresponse.status===200) {
            _updateItemInState(myresponse.result, postLevel, 0, scope, queries, setQueries, _setCounts);
          } else {
            DEBUGGING && console.log(myresponse);
          }
      });
    }

    const newReplyAction = ({replyId=null,
                             queryId=null,
                             opText=null,
                             showPublic=true,
                             scope
                             }) => {
      addQueryReply({user_id: user.userId,
                     query_id: queryId,
                     post_text: opText,
                     show_public: showPublic,
                     item_level: "reply"
                     })
      .then(myresponse => {
        _updateItemInState(myresponse.new_post, 'reply', 0, scope, queries,
                           setQueries, _setCounts);
      });
    }

    const newCommentAction = ({replyId=null,
                               queryId=null,
                               opText=null,
                               showPublic=true,
                               scope
                              }) => {
      addReplyComment({user_id: user.userId,
                      post_id: replyId,
                      query_id: queryId,
                      comment_text: opText,
                      show_public: showPublic,
                      item_level: "comment"
                      })
      .then(myresponse => {
        _updateItemInState(myresponse.new_comment, "comment", queryId, scope,
                           queries, setQueries, _setCounts);
      });
    }

    const updateQueryAction = ({userId=null,
                                queryId=null,
                                opText=null,
                                showPublic=null,
                                flagged=null,
                                pinned=null,
                                popularity=null,
                                helpfulness=null,
                                deleted=null,
                                score=null,
                                queryStatus=null,
                                scope
                                // hidden=null,
                               }) => {
      updateQuery({user_id: userId,
                   query_id: queryId,
                   query_text: opText,
                   show_public: showPublic,
                   //  hidden: hidden,
                   flagged: flagged,
                   pinned: pinned,
                   popularity: popularity,
                   helpfulness: helpfulness,
                   deleted: deleted,
                   score: score,
                   queryStatus: queryStatus,
                   item_level: "query"
                   })
      .then(myresponse => {
        _updateItemInState(myresponse.new_item, "query", 0, scope, queries,
                           setQueries, _setCounts);
      });
    }

    const updateReplyAction = ({userId,
                               replyId,
                               queryId,
                               opText=null,
                               showPublic=null,
                               hidden=null,
                               flagged=null,
                               pinned=null,
                               popularity=null,
                               helpfulness=null,
                               deleted=null,
                               scope
                              }) => {

      updateQueryReply({user_id: userId,
                       post_id: replyId,
                       query_id: queryId,
                       post_text: opText,
                       show_public: showPublic,
                       hidden: hidden,
                       flagged: flagged,
                       pinned: pinned,
                       popularity: popularity,
                       helpulness: helpfulness,
                       deleted: deleted,
                       item_level: "reply"
                       })
      .then(myresponse => {
        _updateItemInState(myresponse.new_post, "reply", 0, scope, queries,
                           setQueries, _setCounts);
      });
    }

    const updateCommentAction = ({userId=null,
                                  commentId=null,
                                  replyId=null,
                                  queryId=null,
                                  opText=null,
                                  showPublic=null,
                                  hidden=null,
                                  flagged=null,
                                  pinned=null,
                                  popularity=null,
                                  helpfulness=null,
                                  deleted=null,
                                  scope
                                  }) => {
      updateReplyComment({user_id: userId,
                         post_id: replyId,
                         comment_id: commentId,
                         comment_text: opText,
                         show_public: showPublic,
                         deleted: deleted,
                         hidden: hidden,
                         flagged: flagged,
                         pinned: pinned,
                         popularity: popularity,
                         helpfulness: helpfulness,
                         item_level: "comment"
                        })
      .then(myresponse => {
        _updateItemInState(myresponse.new_comment, "comment", queryId, scope,
                           queries, setQueries, _setCounts);
      });
    }

    return(
      <Row key="QueriesView" className="queriesview-component panel-view">
        <Col>
          <h2>Questions about
            {!!onStep &&
              <Button
                className={!!onStep && !!singleStep && !nonStep ? "active" : ""}
                onClick={() => setScopeSingleStep()}
              >
                This Step
              </Button>
            }
            <Button
              className={!singleStep && !nonStep ? "active" : ""}
              onClick={() => setScopeAllSteps()}
            >
              All Steps
            </Button>
            <Button
              className={!!nonStep ? "active" : ""}
              onClick={() => setScopeGeneral()}
            >
              General
            </Button>
          </h2>

          <Form id={`filterUnansweredCheckbox`}
            inline
            className="query-filter-form"
          >
            <Form.Check inline label="Only unread"
              id="only-unread-checkbox"
              type="switch"
              className="small"
              // defaultValue={filterUnread}
              isSelected={filterUnread}
              onChange={e => setFilterUnread(!filterUnread)}
              />
            <Form.Check inline label="Only unanswered"
              id="only-unanswered-checkbox"
              type="switch"
              className="small"
              // defaultValue={filterUnanswered}
              isSelected={filterUnanswered}
              onChange={e => setFilterUnanswered(!filterUnanswered)}
              />
          </Form>

          <div className="queries-view-wrapper">
            <ScopesFrame
                viewScope={viewScope}
                nonStep={nonStep}
                singleStep={singleStep}
                viewingAsAdmin={viewingAsAdmin}
                viewCourse={viewCourse}
                setViewCourse={setViewCourse}
                viewStudents={viewStudents}
                setViewStudents={setViewStudents}
                courseChangeFunctions={courseChangeFunctions}
                queries={queries}
                setQueries={setQueries}
                userTotalCount={userTotalCount}
                userUnreadCount={userUnreadCount}
                classmatesTotalCount={classmatesTotalCount}
                classmatesUnreadCount={classmatesUnreadCount}
                myClassmatesCounts={myClassmatesCounts}
                setViewScope={setViewScope}
                studentsTotalCount={studentsTotalCount}
                studentsUnreadCount={studentsUnreadCount}
                myStudentsCounts={myStudentsCounts}
                otherTotalCount={otherTotalCount}
                otherUnreadCount={otherUnreadCount}
                newQueryAction={newQueryAction}
                updateQueryAction={updateQueryAction}
                newReplyAction={newReplyAction}
                updateReplyAction={updateReplyAction}
                newCommentAction={newCommentAction}
                updateCommentAction={updateCommentAction}
                setReadStatusAction={setReadStatusAction}
                page={page}
                setPage={setPage}
                filterUnread={filterUnread}
                loading={loading}
                loadingCounts={loadingCounts}
            />
          </div>
        </Col>
      </Row>
    )
}

export default QueriesView;