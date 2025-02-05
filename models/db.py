# -*- coding: utf-8 -*-
"""
PAIDEIA GREEK LEARNING APP

This is the base model file that bootstraps the web2py platform for the
Paideia web-app.

Third-party python packages required for this app:
    - pytz
    - pyicu (icu -- need to install c library via apt first)
    - kitchen
    - python-dateutil (dateutil, six)
    - memory_profiler
    - pytest
"""

import logging
import uuid  # or gluon.utils.web2py_uuid ?
import datetime
from pytz import common_timezones
import pytz
from gluon.tools import Recaptcha2, Auth, Mail, Crud, Service, PluginManager
from gluon.tools import IS_IN_SET
from gluon.globals import current
import bootstrap3 as bs3  # needed here even though not used
if 0:
    from web2py.gluon import DAL, URL, Field, SQLFORM
    from web2py.gluon.tools import Recaptcha2, Auth, Mail, Crud, Service, PluginManager
    from web2py.gluon.tools import IS_IN_SET
    from web2py.gluon.globals import current

response = current.response
request = current.request
now = datetime.datetime.utcnow()

if request.is_local:  # disable in production enviroment
    from gluon.custom_import import track_changes
    track_changes(True)

# -------------------------------------------------------------
# get private data from secure file
# -------------------------------------------------------------
keydata = {}
with open('applications/paideia/private/app.keys', 'r') as keyfile:
    for line in keyfile:
        k, v = line.split()
        keydata[k] = v

# -------------------------------------------------------------
# Recognize when running in test environment
# -------------------------------------------------------------
# This section adapted from https://github.com/viniciusban/web2py.test
# note: with Ubuntu, put test db on ramdisk with /dev/shm directory.
temp_dir = '/dev/shm/' + request.application
# temp_dir = '/tmp'


def _i_am_running_under_test():
    '''Check if Web2py is running under a test environment.
    '''

    test_running = False
    if request.is_local:
        # IMPORTANT: the temp_filename variable must be the same as the one set
        # on your tests/conftest.py file.
        temp_filename = '{}/tests_{}.tmp'.format(temp_dir, request.application)

        import glob
        if glob.glob(temp_filename):
            test_running = True

    return test_running


# -------------------------------------------------------------
# define database storage
# -------------------------------------------------------------

postgre = {}
postgre['username'] = keydata['postgre_username']
postgre['password'] = keydata['postgre_password']
postgre['host'] = keydata['postgre_host']
postgre['db_name'] = keydata['postgre_dbname']


# set the postgres dbase to the test dbase
if _i_am_running_under_test():
    postgre['db_name'] = keydata['postgre_testdbname']
# print(('--- using dbase: ', postgre['db_name'], ' ---'))
# check_reserved makes sure no column names conflict with back-end db's
# connect_string = 'postgres:psycopg2://{}:{}@{}/{}'.format(postgre['username'],
connect_string = 'postgres:psycopg2://{}:{}@{}:5434/{}'.format(
                                                          postgre['username'],
                                                          postgre['password'],
                                                          postgre['host'],
                                                          postgre['db_name'])
# make sure migrate is false during tests
if _i_am_running_under_test():
    db = DAL(connect_string, pool_size=1,
             check_reserved=['sqlite', 'postgres'],
             migrate=True, fake_migrate_all=False)
    # print(('--- adapter: ', db._adapter.driver.__name__))
    # print('--- TEST DATABASE ---')
else:
    db = DAL(connect_string, pool_size=1,
             check_reserved=['sqlite', 'postgres'],
             migrate=True, fake_migrate_all=False)
    # print(('--- adapter: ', db._adapter.driver.__name__))

# -------------------------------------------------------------
# Set up logging
# -------------------------------------------------------------
logger = logging.getLogger('web2py.app.paideia')
logger.setLevel(logging.DEBUG)

# -------------------------------------------------------------
# Generic views
# -------------------------------------------------------------
# by default give a view/generic.extension to all actions from localhost
# none otherwise. a pattern can be 'controller/function.extension'
response.generic_patterns = ['*'] if request.is_local else []

# -------------------------------------------------------------
# set up services
# -------------------------------------------------------------
crud = Crud(db)                 # for CRUD helpers using auth
service = Service()             # for json, xml, jsonrpc, xmlrpc, amfrpc
plugins = PluginManager()       # for configuring plugins
current.db = db                 # to access db from modules

# -------------------------------------------------------------
# configure authorization
# -------------------------------------------------------------
auth = Auth(db, hmac_key=Auth.get_or_create_key())  # authent/authorization

# -------------------------------------------------------------
# place auth in current so it can be imported by modules
# -------------------------------------------------------------

current.auth = auth

# -------------------------------------------------------------
# misc auth settings
# -------------------------------------------------------------
auth.settings.create_user_groups = False
auth.settings.label_separator = ''
auth.settings.email_case_sensitive = True
auth.settings.allow_basic_login = True

# -------------------------------------------------------------
# Customizing auth tables
# -------------------------------------------------------------

# adding custom field for user time zone
auth.settings.extra_fields['auth_user'] = [
    Field('time_zone',
          'string',
          default='America/Toronto',
          requires=IS_IN_SET((common_timezones)),
          widget=SQLFORM.widgets.options.widget
          ),
    Field.Virtual('tz_obj',
                  lambda row:
                  pytz.timezone(row.auth_user.time_zone.replace('|', ''))
                  if (hasattr(row.auth_user, 'time_zone') and
                      row.auth_user.time_zone)
                  else 'America/Toronto'
                  ),
    Field('uuid', length=64, default=lambda:str(uuid.uuid4())),
    Field('modified_on', 'datetime', default=request.now),
    Field('hide_read_queries', 'boolean', default=False),
]

# adding custom field for class info in groups
auth.settings.extra_fields['auth_group'] = [
    Field('institution', 'string', default='Tyndale Seminary'),
    Field('academic_year', 'integer', default=now.year),  # was year
    Field('term', 'string'),
    Field('course_section', 'string'),
    Field('course_instructor', 'reference auth_user', default=auth.user_id),
    Field('start_date', 'datetime'),
    Field('end_date', 'datetime'),
    Field('paths_per_day', 'integer', default=40),
    Field('days_per_week', 'integer', default=5),
    Field('uuid', length=64, default=lambda:str(uuid.uuid4())),
    Field('modified_on', 'datetime', default=request.now)
]

auth.settings.extra_fields['auth_membership'] = [
    Field('uuid', length=64, default=lambda:str(uuid.uuid4())),
    Field('modified_on', 'datetime', default=request.now)
]

auth.settings.extra_fields['auth_permission'] = [
    Field('uuid', length=64, default=lambda:str(uuid.uuid4())),
    Field('modified_on', 'datetime', default=request.now)
]

auth.settings.extra_fields['auth_event'] = [
    Field('uuid', length=64, default=lambda:str(uuid.uuid4())),
    Field('modified_on', 'datetime', default=request.now)
]

auth.settings.extra_fields['auth_cas'] = [
    Field('modified_on', 'datetime', default=request.now)
]

auth.define_tables()                           # creates all needed tables
db.auth_user._format = lambda row: '{}, {}: {}'.format(row.last_name,
                                                       row.first_name,
                                                       row.id)

# -------------------------------------------------------------
# Mail config
# -------------------------------------------------------------

mail = Mail()
mail.settings.server = keydata['email_server']  # 'logging' # SMTP server
mail.settings.sender = keydata['email_address']  # email
mail.settings.login = '{}:{}'.format(keydata['email_user'],
                                     keydata['email_pass'])
mail.settings.hostname = keydata['email_hostname']
mail.settings.tls = True
current.mail = mail

auth.settings.mailer = mail                    # for user email verification
auth.settings.registration_requires_verification = False
auth.settings.registration_requires_approval = False
auth.messages.verify_email = 'Click on the link http://' \
    + request.env.http_host + URL('default', 'user', args=['verify_email']) \
    + '?key=%(key)s to verify your email'
auth.settings.reset_password_requires_verification = True
auth.messages.reset_password = 'Click on the link http://' \
    + request.env.http_host + URL('default', 'user', args=['reset_password'])\
    + '?key=%(key)s to reset your password'

# -------------------------------------------------------------
# enable recaptcha anti-spam for selected actions
# -------------------------------------------------------------

# mycaptcha = Recaptcha2(request, keydata['captcha_public_key'],
#                        keydata['captcha_private_key'])
# auth.settings.login_captcha = None
# auth.settings.register_captcha = mycaptcha
# auth.settings.retrieve_username_captcha = mycaptcha
# auth.settings.retrieve_password_captcha = mycaptcha

# -------------------------------------------------------------
# crud settings
# -------------------------------------------------------------

crud.settings.auth = auth  # =auth to enforce authorization on crud
