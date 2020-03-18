import React, { useState, useContext } from "react";
import {
  Row,
  Col,
  Form,
  Alert
} from "react-bootstrap";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { UserContext } from "../UserContext/UserProvider";

const SettingsView = () => {

  const { user, dispatch } = useContext(UserContext);
  console.log(user.reviewSet);
  console.log(user.currentBadgeSet);


  const reviewAction = setNum => {
    console.log(setNum);
    dispatch({type: 'setReviewSet', payload: parseInt(setNum.slice(10))});
  }

  return (
    <Row key="SettingsView" className="settingsview-component panel-view">
      <Col>
        <h2>Settings</h2>{user.reviewSet}
        <Form>
          <Form.Row>
            <Col>
              <Form.Group controlId="vocab-set-control">
                <Form.Label>
                  <FontAwesomeIcon icon="history" />Review a badge set
                </Form.Label>
                <Form.Control as="select"
                  onChange={e => reviewAction(e.target.value)}
                >
                  {!!user.reviewSet && <option key={user.reviewSet}>
                    {`review set ${user.reviewSet}`}
                   </option>
                  }
                  <option key="0">Not reviewing (normal mode)</option>
                  {Array.from('x'.repeat(user.currentBadgeSet), (_, i) => 1 + i).map( n =>
                      n == user.reviewSet ? "" : <option key={n + 1}>{`review set ${n}`}</option>
                  )}
                </Form.Control>
                <Form.Text>
                    <p>
                      If you select a badge set from this list you will only be given paths selected (randomly) from that set. When you want to return to the normal selection of paths, select 'Stop reviewing.'
                    </p>
                    <p>
                      Reviewing is automatically turned off at the beginning of each day, so you will need to select a review set again on each day that you want to continue reviewing.
                    </p>
                    <Alert variant="danger">
                      <FontAwesomeIcon icon="exclamation-triangle" size="2x" />
                      Keep in mind that while you are reviewing you are not making progress with your newest badge set.
                    </Alert>
                    <p>
                      Note that because review mode selects paths randomly you may experience more repetition than usual. You are also not allowed to review your current badge set. This is because the review function does not focus on any particular badges within a set. Regular mode, though, focuses at least half of your paths each day on the specific badges that remain at "beginner" level. So regular mode is actually better for progressing through your newest material.
                    </p>
                </Form.Text>
              </Form.Group>
            </Col>
          </Form.Row>
        </Form>
      </Col>
    </Row>
  )
}

export default SettingsView;