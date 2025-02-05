import React, { useEffect } from 'react';
import "core-js/stable";
import "regenerator-runtime/runtime";
import { recaptchaKey } from "../variables";
import { loadScriptByURL,
         doApiCall
       } from "../Services/utilityService";
import { async } from 'regenerator-runtime';
import { DEBUGGING } from '../variables';

/**
 *
 * expects payload with keys:
 *   email
 *   token
 */
const startPasswordReset = async (payload) => doApiCall(payload,
                                                        "start_password_reset",
                                                        "form");

/**
 *
 * expects payload with keys:
 *   resetKey,
 *   token,
 *   passwordA,
 *   passwordB
 */
const doPasswordReset = async payload => await doApiCall(payload,
                                                           "do_password_reset",
                                                           "form");
/**
 *
 * expects payload with keys:
 *   token
 *   firstName
 *   lastName
 *   timeZone
 *   email
 *   password
 */
const register = async payload => await doApiCall(payload, "get_registration",
                                                  "form");

/**
 *
 * expects payload with keys:
 *   course_key
 */
const validateCourseKey = async payload => await doApiCall(
  payload, "validate_class_key", "form");

/**
 *
 * expects payload with keys:
 *   token
 *   order_items
 *   course_key
 */
const createCheckoutIntent = async payload => await doApiCall(
  payload, "create_checkout_intent", "form");

/**
 *
 * expects payload with keys:
 *   user_id
 *   course_key
 *   course_id
 */
const joinCourseGroup = async payload => await doApiCall(
  payload, "join_class_group", "form");

/**
 * Expects payload with keys:
 *   token
 *   email,
 *   password
 *  */
const login = async payload => await doApiCall(payload, "get_login", "form");

const logout = async () => await doApiCall({}, "do_logout", "none", "GET");

const checkLogin = async (user, dispatch) => {
  let response = await doApiCall({}, "check_login", "none", "GET");

  let myVal = true;

  if ( !!user.userLoggedIn && !!response.logged_in ) {
    DEBUGGING && console.log('logged in both');

    if ( user.userId !== response.user ) {
      myVal = false;
      throw new Error("local user doesn't match server login");
    }
  } else if ( !user.userLoggedIn && !!response.logged_in ) {
    DEBUGGING && console.log('logged in server only');
    updateUserInfo(dispatch);

  } else if ( (!!user.userID || !!user.userLoggedIn) && !response.logged_in ) {
    DEBUGGING && console.log('logged in local only');
    dispatch({type: 'deactivateUser'});
    myVal = false;
  }
  return myVal;
}

const updateUserInfo = async dispatch => {
  let response = await doApiCall({}, "get_userdata", "none", "GET");
  const myinfo = formatLoginData(response);
  dispatch({type: 'initializeUser', payload: myinfo});
  return myinfo;
}

const getBadgeTableData = async ({forSelf=false,
                                  userId=null,
                                  dispatch=null}) => {
  let response = await doApiCall({badge_stats: true},
                                 `users/${userId}`,
                                 "queryString",
                                 "GET");
  let mydata = {};
  if ( response.status===200 ) {
    mydata = {
      badgeTableData: response.badge_table_data,
      status: response.status
    }
    if ( !!forSelf ) {
      dispatch({type: "updateProfileInfo", payload: mydata});
    }
  } else {
    mydata = response;
  }
  return mydata
}

const getProfileInfo = async ({forSelf=false,
                               userId=null,
                               dispatch=null}) => {
  let response = await doApiCall({},
                                 `users/${userId}`,
                                 "queryString",
                                 "GET");
  let mydata = {};
  if ( response.status===200 ) {
    mydata = {
      firstName: response.the_name.first_name,
      lastName: response.the_name.last_name,
      email: response.email,
      timezone: response.tz,
      pathsPerDay: response.paths_per_day,
      daysPerWeek: response.days_per_week,
      currentBadgeSet: response.max_set,
      badgeLevels: response.badge_levels,
      calendar: response.cal,
      badgeTableData: response.badge_table_data,
      answerCounts: response.answer_counts,
      badgeSetDict: response.badge_set_dict,
      badgeSetMilestones: response.badge_set_milestones,
      chart1Data: response.chart1_data,
      endDate: response.end_date,
      startingSet: response.starting_set,
      classInfo: response.class_info,
      otherClassInfo: response.other_class_info,
      status: response.status
    }
    if ( !!forSelf ) {
      dispatch({type: "updateProfileInfo", payload: mydata});
    }
  } else {
    mydata = response;
  }
  return mydata
}

/**
 * Return data on one month of app activity for a given user
 *
 * expects payload keys:
 *  userId
    year
    month
 */
const getCalendarMonth = async ({userId, year, month}
  ) => await doApiCall({year: year,
                        month: month},
                       `users/${userId}`, "queryString", "GET");

const formatLoginData = (data) => {
  return {
    userId: data['id'],
    firstName: data['first_name'],
    lastName: data['last_name'],
    email: data['email'],
    userLoggedIn: true,
    userRoles: data['roles'],
    userToken: '',
    userTimezone: data['time_zone'],
    hideReadQueries: data['hide_read_queries'],
    currentBadgeSet: data['current_badge_set'],
    reviewSet: data['review_set'],
    dailyQuota: data['daily_quota'],
    weeklyQuota: data['weekly_quota'],
    classInfo: data['class_info'],
    instructing: data['instructing']
  }
}

/**
 * React HOC that provides recaptcha integration to the wrapped component
 *
 * The wrapped component is provided with a `submitAction` prop.
 * Any call to a server action wrapped with submitAction() will be
 * protected by recaptcha v3 and will receive the extra `token` argument
 * to pass on to the server call.
 *
 *
 * @component
 * @param {JSX.Element} Component the component to be decorated
 * @param {object} props this component's properties
 * @param {string} props.rkey a valid recaptcha v. 3 site key
 * @param {function} props.actionName a function making a server request that
 *                                    will be protected by recaptcha
 * @returns {JSX.Element} A react component with an extra `submitAction`
 *                        prop
 */
const withRecaptcha = (Component, actionName) => ({rkey=recaptchaKey,
                                                   ...throughProps}) => {
  useEffect(() => {
    loadScriptByURL("recaptcha-key",
        `https://www.google.com/recaptcha/api.js?render=${rkey}`, function () {
            DEBUGGING && console.log("Recaptcha Script loaded!");
        }
    );
  }, []);

  const submitAction = (event, myAction) => {
    if ( !!event ) {
      event.preventDefault();
    };
    window.grecaptcha.ready(() => {
        window.grecaptcha.execute(rkey, { action: actionName })
        .then(token => { myAction(token); });
    });
  }

  return (
    <Component submitAction={submitAction} {...throughProps} />
  )
}

const useRecaptcha = (actionName, requestFunction) => {
  DEBUGGING && console.log(actionName);
  DEBUGGING && console.log(requestFunction);
  const rkey = recaptchaKey
  useEffect(() => {
    loadScriptByURL("recaptcha-key",
        `https://www.google.com/recaptcha/api.js?render=${rkey}`, function () {
            DEBUGGING && console.log("Recaptcha Script loaded!");
        }
    );
  }, []);

  return () => {
    window.grecaptcha.ready(() => {
        window.grecaptcha.execute(rkey, { action: actionName })
        .then(token => { requestFunction(token); });
    });
  }
}

export {
  startPasswordReset,
  doPasswordReset,
  register,
  validateCourseKey,
  createCheckoutIntent,
  joinCourseGroup,
  login,
  logout,
  checkLogin,
  updateUserInfo,
  getBadgeTableData,
  getProfileInfo,
  getCalendarMonth,
  formatLoginData,
  useRecaptcha,
  withRecaptcha
}