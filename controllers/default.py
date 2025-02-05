#! /usr/bin/python3.6
# -*- coding: utf-8 -*-

from copy import copy
import datetime
from memory_profiler import profile
from pprint import pprint
from paideia_stats import Stats, get_set_at_date, get_term_bounds
from paideia_stats import get_current_class
from paideia_bugs import Bug, trigger_bug_undo
from gluon.serializers import json
from gluon.tools import Service
service = Service()
if 0:
    from web2py.applications.paideia.modules.paideia_stats import Stats, get_set_at_date, get_term_bounds
    from web2py.applications.paideia.modules.paideia_stats import get_current_class
    from web2py.applications.paideia.modules.paideia_bugs import Bug, trigger_bug_undo
    from web2py.gluon.serializers import json
    from web2py.gluon import current, URL, TABLE, TR, TD, TH
    from web2py.gluon.tools import Auth
    from web2py.gluon.dal import DAL
    db = DAL()
    auth = Auth()
    response, session = current.response, current.session
    T, service = current.T, current.service
    request = current.request

mail = current.mail


def index():
    """    """
    redirect("paideia")

    return {}


def faqs():
    """ """
    faqs_topic = db(db.topics.topic == 'faqs').select(db.topics.id).first()
    faqs = db(db.content_pages.topics.contains([faqs_topic.id])
              ).select().as_list()
    return {'faqs': faqs}


def user():
    """
    exposes:
    http://..../[app]/default/user/login
    http://..../[app]/default/user/logout
    http://..../[app]/default/user/register
    http://..../[app]/default/user/profile
    http://..../[app]/default/user/change_password
    http://..../[app]/default/user/verify_email
    http://..../[app]/default/user/retrieve_username
    http://..../[app]/default/user/request_reset_password
    http://..../[app]/default/user/reset_password
    http://..../[app]/default/user/impersonate  # user is request.args[0]
        auth.is_impersonating() checks whether current user is shadowing
        another only allowed if has_permission('impersonate', db.auth_user,
        user_id)
    http://..../[app]/default/user/groups
        lists user's group memberships
    http://..../[app]/default/user/not_authorized

    code for these actions is in gluon/tools.py in Auth() class
    """
    # Scripts for charts
    # response.files.append('//cdnjs.cloudflare.com/ajax/libs/d3/3.4.10/d3.min.js')
    response.files.append(imports['d3'])
    response.files.append(imports['d3_infocharts'])

    # Include files for Datatables jquery plugin and bootstrap css styling
    response.files.append(imports['datatables_css'])
    response.files.append(imports['pdfmake'])
    response.files.append(imports['pdfmake_vfsfonts'])
    response.files.append(imports['datatables'])

    return dict(form=auth())


def set_query_visibility():
    """
    Set hide_read_queries field of an auth_user record to the supplied value.

    Returns:
        Nothing.

    Expects two request.args:
        0:      The id of the user (str)
        1:      A string representing the boolean value (str)
    """
    uid = int(request.args[0])
    myval = True if request.args[1] == 'true' else False
    myrow = db.auth_user(uid)
    myrow.update_record(hide_read_queries=myval)
    db.commit()
    print(db.auth_user(uid).hide_read_queries)


def mark_bug_read():
    """
    Set the 'hidden' field for provided bug report based on boolean provided.

    Expects two request.args
    0:      The id of the bug (str)
    1:      A string representing a boolean value (str)
    """
    bugid = int(request.args[0])
    myval = True if request.args[1] == 'true' else False
    new_status = {'hidden': myval}
    result = Bug.update_bug(bugid, new_status)
    return 'false' if result is False else result


def mark_bug_deleted():
    """
    Set the 'deleted' field for provided bug report based on boolean provided.

    Expects one value in request.args
    0:      The id of the bug (str)
    """
    bugid = int(request.args[0])
    return Bug.delete_bug(bugid)


def update_bug_user_comment():
    """
    Update the user_comment field of the specified bugs record.

    Expects two request.args
    0:      The id of the bug (str)
    1:      A string containing the updated user comment text.
    """
    bugid = int(request.args[0])
    new_comment = {'user_comment': request.vars['mytext']}
    result = Bug.update_bug(bugid, new_comment)
    return 'false' if result is False else result


def update_bug():
    """
    Update any field(s) of the specified bugs record.

    Expects one request.args
    0:      The id of the bug (str)

    Excpects one request.vars value for each field to be updated. The key for
    each value must be identical to the desired field in db.bugs.
    """
    bugid = int(request.args[0])
    new_vals = {'bug_status': int(request.vars['bug_status']),
                'admin_comment': request.vars['admin_comment'],
                'adjusted_score': float(request.vars['adjusted_score']) if
                request.vars['adjusted_score'] not in
                ['none', 'None'] else None
                }
    if 'score' in list(request.vars.keys()) and \
            request.vars['log_id'] not in ['None', 'none', None]:
        logrow = db.attempt_log(int(request.vars['log_id']))
        if logrow and logrow.score <= new_vals['adjusted_score']:
            undo_vals = copy(new_vals)
            extra_vals = {'step': int(request.vars['step']),
                          'in_path': int(request.vars['in_path']),
                          'map_location': int(request.vars['map_location']),
                          'id': int(bugid),
                          'log_id': int(request.vars['log_id']),
                          'score': float(request.vars['score']),
                          'user_name': int(request.vars['user_name']),
                          'user_comment': request.vars['user_comment'],
                          'user_response': request.vars['user_response']
                          }
            undo_vals.update(extra_vals)
            trigger_bug_undo(**undo_vals)

    result = Bug.update_bug(bugid, new_vals)

    return 'false' if result is False else result


# @profile
def info():
    """
    Return data reporting on a user's performance record.

    This controller is intended to serve the view profile.load as a modular
    page component, to be embedded in other views such as:
        default/user.html
        reporting/user.html

    Returns:
        dict: with the following keys:
            the_name (str):             User's name from auth.user as lastname,
                                            firstname
            user_id(int):               The requested user's id.
            tz(str??):                  User's time zone from auth.user
                                            (extended in db.py)
            email(str):                 User's email
            starting_set(int):          badge set at which the user began
                                            his/her current course section
            end_date(str??):            ending date for user's current course
                                            section
            cal(html helper obj):       html calendar with user path stats
                                            (from Stats.monthcal)
            blist(list):                list of User's bug reports
            max_set(int):               Furthest badge set reached to date by
                                            user (from Stats.max)
            badge_levels(dict):         Dictionary with badge levels (int) as
                                            keys and a list of badge names (or
                                            tag: int) as each value.
            badge_table_data(list):     A list of dictionaries with info on
                                            user badge progress (from
                                            Stats.active_tags)
            badge_set_milestones(list): List of 'upgrades' of the highest badge
                                            set and their dates
            answer_counts(list):        List of counts of right and wrong
                                            answers for each active day
            chart1_data(dict):          dictionary of data to build stats chart
                                            in view (from get_chart1_data)
            reviewing_set():            session.set_review,
            badge_set_dict():           badge_set_dict
    """
    debug = False
    if debug:
        print('===================================')
        print('starting controller default.info')
    # Allow passing explicit user but default to current user
    if 'id' in request.vars:
        user = db.auth_user[request.vars['id']]
    else:
        user = db.auth_user[auth.user_id]

    stats = Stats(user.id)
    now = datetime.datetime.utcnow()
    if debug:
        print('now is', now)

    # get user's current course
    myc = get_current_class(user.id, datetime.datetime.utcnow())
    if debug:
        print('myc is', myc)

    # tab1

    name = stats.get_name()
    tz = user.time_zone
    email = user.email
    max_set = stats.get_max()
    badge_levels = stats.get_badge_levels()
    badge_table_data = stats.active_tags()  # FIXME: 29Mi of memory use

    start_date, fmt_start, end_date, fmt_end = None, None, None, None
    if myc:
        start_date, fmt_start, end_date, fmt_end, \
            prevend, fmt_prevend = get_term_bounds(
                myc.class_membership.as_dict(),
                myc.classes.start_date,
                myc.classes.end_date)
        try:
            starting_set = int(myc.class_membership.starting_set)
        except (ValueError, TypeError):
            starting_set = None
        if not starting_set:
            starting_set = get_set_at_date(user.id, start_date)
            print('starting_set++++++++++++++++++++++++++++++++++++++++++++++++')
            print(starting_set)
        goal = myc.classes.a_target

        if myc.class_membership.custom_a_cap:  # allow personal targets
            target_set = myc.class_membership.custom_a_cap
        else:  # default to class target/cap
            cap = myc.classes.a_cap
            target_set = starting_set + goal
            if cap and target_set > cap:
                target_set = cap
    else:
        starting_set = None
        goal = None
        target_set = None

    # tab2
    mycal = stats.monthcal()
    # badges_tested_over_time = stats.badges_tested_over_time(badge_table_data)
    # sets_tested_over_time = stats.sets_tested_over_time(badge_table_data)
    # steps_most_wrong = stats.steps_most_wrong(badge_table_data)

    # tab3
    b = Bug()
    blist = b.bugresponses(user.id)

    # tab5
    mydata = get_chart1_data(user_id=user.id)
    print('E')
    chart1_data = mydata['chart1_data']  # FIXME: 3Mi of memory use
    badge_set_milestones = mydata['badge_set_milestones']
    answer_counts = mydata['answer_counts']
    badge_set_dict = {}
    set_list_rows = db().select(db.tags.tag_position, distinct=True)
    set_list = sorted([row.tag_position for row in set_list_rows
                       if row.tag_position < 90])
    all_tags = db((db.tags.id > 0) &
                  (db.badges.tag == db.tags.id)
                  ).select()
    for set in set_list:
        set_tags = all_tags.find(lambda r: r.tags.tag_position == set)
        set_tags_info = [{'tag': r.tags.id, 'badge_title': r.badges.badge_name}
                         for r in set_tags]
        badge_set_dict[set] = set_tags_info

    query_visibility = user['hide_read_queries']
    print('QV is', query_visibility)

    return {'the_name': name,
            'user_id': user.id,
            'tz': tz,
            'email': email,
            'starting_set': starting_set,
            'target_set': target_set,
            'end_date': fmt_end,
            'cal': mycal,
            'blist': blist,
            'max_set': max_set,
            'badge_levels': badge_levels,
            'badge_table_data': badge_table_data,
            'badge_set_milestones': badge_set_milestones,
            'answer_counts': answer_counts,
            'chart1_data': chart1_data,
            'reviewing_set': session.set_review,
            'badge_set_dict': badge_set_dict,
            'query_visibility': query_visibility
            }


def get_chart1_data_json():
    '''
    Wrapper for get_chart1_data() to allow getting a json-formatted return val.

    '''
    user_id = request.vars['user_id'] if 'user_id' in request.vars \
        else auth.user_id
    set = request.vars['set'] if 'set' in request.vars else None
    tag = request.vars['tag'] if 'tag' in request.vars else None
    chart1_data = get_chart1_data(user_id=user_id, set=set, tag=tag)
    return json(chart1_data['chart1_data'])


def get_chart1_data(user_id=None, set=None, tag=None):
    '''
    Fetch raw data to present in first user profile chart.

    This function is isolated so that it can be called directly from ajax
    controls on the chart itself, as well as programmatically from info().

    Returns:
        dict:

    '''
    # def milliseconds(dt):
    #     return (dt-datetime.datetime(1970,1,1)).total_seconds() * 1000
    user_id = user_id if user_id else auth.user_id
    stats = Stats(user_id)
    badge_set_milestones = stats.get_badge_set_milestones()
    print('F')
    answer_counts = stats.get_answer_counts(set=set, tag=tag)

    chart1_data = {'badge_set_reached': [{'date': dict['my_date'],
                                          'set': dict['badge_set']} for dict
                                         in badge_set_milestones],
                   'answer_counts': [{'date': dict['my_date'],
                                      'total': dict['right'] + dict['wrong'],
                                      'ys': [{'class': 'right',
                                              'y0': 0,
                                              'y1': dict['right']},
                                             {'class': 'wrong',
                                              'y0': dict['right'],
                                              'y1': dict['right'] +
                                              dict['wrong']}
                                             ],
                                      'ids': dict['ids']
                                      } for dict in answer_counts],
                   # above includes y values for stacked bar graph
                   # and 'ids' for modal presentation of daily attempts
                   }

    return {'chart1_data': chart1_data,
            'badge_set_milestones': badge_set_milestones,
            'answer_counts': answer_counts}


def get_day_attempts():
    ids = request.vars['ids']
    ids = ids.split(',')
    myrows = db((db.attempt_log.id.belongs(ids)) &
                (db.attempt_log.step == db.steps.id)).select()
    attempt_list = TABLE(TR(TH('Prompt'),
                            TH('My Response'),
                            TH('Score'),
                            TH('Review Level'),
                            TH('New Content'),
                            TH('Related Badges')
                            ),
                         _class='table')
    for row in myrows:
        mytags = db.steps(row['attempt_log']['step']).tags
        mybadges = [db(db.badges.tag == t).select().first().badge_name
                    for t in mytags]
        mybadges_string = ', '.join(mybadges)
        myclass = 'success' if row.attempt_log.score > 0.01 else 'warning'
        attempt_list.append(TR(TD(row.steps.prompt, _class=myclass),
                               TD(row.attempt_log.user_response,
                                  _class=myclass),
                               TD(row.attempt_log.score, _class=myclass),
                               TD(row.attempt_log.selection_category,
                                  _class=myclass),
                               TD(row.attempt_log.new_content, _class=myclass),
                               TD(mybadges_string, _class=myclass)
                               ))
    return attempt_list


def set_review_mode():
    debug = False
    try:
        myset = int(request.args[0])
    except (ValueError, TypeError):  # if passed a non-numeric value
        myset = None
    session.set_review = myset
    if debug:
        print('session.set_review is', session.set_review)


def oops():
    """A controller to handle rerouted requests that return error codes."""
    code = request.vars.code
    ticket = request.vars.ticket

    # requested_uri = request.vars.requested_uri
    request_url = request.vars.request_url

    # Return the original HTTP error code
    response.status = code
    # if code == 500:
    title = 'Paideia - Internal error reported'
    msg = '<html><body>Hello Ian,<br>I seem to have run into an error!' \
          'request url:<br /><br />{url}' \
          '<br /><br />' \
          'Here is the ticket:<br /><br />' \
          'local: <a href="http://127.0.0.1:8000/admin/default/ticket/{t}" ' \
          ' target="_blank">{t}</a>' \
          '<br /><br />' \
          'remote: <a href="https://ianwscott.webfactional.com/' \
          'admin/default/ticket/{t}" target="_blank">{t}</a>' \
          '</body></html>'.format(url=request_url, t=ticket)

    mail.send(mail.settings.sender, title, msg)

    return {'code': code}


@auth.requires_membership(role='administrators')
def csv():
    """
    generic csv function to export a single table.

    The table is set via the first url argument.
    """
    table = request.args[0]
    items = db().select(db[table].ALL)
    return {'items': items}


def download():
    """
    allows downloading of uploaded files
    http://..../[app]/default/download/[filename]
    """
    return response.download(request, db)


@auth.requires_login()
def call():
    '''
    exposes services. for example:
    http://..../[app]/default/call/jsonrpc
    decorate with @services.jsonrpc the functions to expose
    supports xml, json, xmlrpc, jsonrpc, amfrpc, rss, csv
    '''
    response.headers["Access-Control-Allow-Origin"] = '*'
    response.headers['Access-Control-Max-Age'] = 86400
    response.headers['Access-Control-Allow-Headers'] = '*'
    response.headers['Access-Control-Allow-Methods'] = '*'
    response.headers['Access-Control-Allow-Credentials'] = 'true'

    return service()


"""
@auth.requires_signature()
def data():
    '''
    http://..../[app]/default/data/tables
    http://..../[app]/default/data/create/[table]
    http://..../[app]/default/data/read/[table]/[id]
    http://..../[app]/default/data/update/[table]/[id]
    http://..../[app]/default/data/delete/[table]/[id[
    http://..../[app]/default/data/select/[table]
    http://..../[app]/default/data/search/[table]
    but URLs bust be signed, i.e. linked with
      A('table',_href=URL('data/tables',user_signature=True))
    or with the signed load operator
      LOAD('default','data.load',args='tables',ajax=True,user_signature=True)
    '''
    return dict(form=crud())
"""


# TODO: does the mail function below make sense?
@auth.requires_membership(role='administrators')
def send_mail_to_user():
    addr = db(db.auth_user.id == session.the_student
              ).select(db.auth_user.email)
    subj = session.mail_subject
    msg = session.mail_message

    if mail.send(to=addr, subject=subj, message=msg):
        response.flash('mail sent successfully')
    else:
        response.flash('There was a problem sending the mail.')

    return
