Genocrunch
==========

A web-based platform for mining metagenomic data

**Official web server:** <https://genocrunch.epfl.ch>

## Rights

- **Copyright:** All rights reserved. ECOLE POLYTECHNIQUE FEDERALE DE LAUSANNE, Switzerland, Laboratory of Intestinal Immunology, 2016-2018
- **Licence:** GNU AGPL 3 (See LICENCE.txt for details)
- **Authors:** AR Rapin, FPA David, C Pattaroni, J Rougemont, BJ Marsland and NL Harris

## Resources

- **Git clone URL:** <https://c4science.ch/source/genocrunch-2.1.git>
- **Documentation:** <https://c4science.ch/source/genocrunch-2.1/browse/master/README.md>
- **Licence:** <https://www.gnu.org/licenses/agpl-3.0.md>

## Framework

Genocrunch uses the ruby on [Rails](http://rubyonrails.org/) framework with a PostgreSQL database.

## Supported platforms

- **Linux** (tested on Ubuntu 16.04 LTS and CentOS 7)
- **macOS** (tested on 10.12 Sierra)

## Supported web browsers

- **Mozilla Firefox** *(Mobile versions are not supported)*

## Requirements

- **Ruby version 2.3.1**
- **Rails version 5.0.0**
- **Python version >=2.7.0 <3.0.0**
- **R version >3.2.2**

## Installation *(Debian Linux and macOS)*

### Ruby, Rails and PostgreSQL

**Debian Linux**

  Uninstall possible pre-installed versions of ruby:
<pre>
$ sudo apt-get purge ruby
</pre>

  (Re-)install ruby and Rails using rbenv (see [here](https://www.digitalocean.com/community/tutorials/how-to-install-ruby-on-rails-with-rbenv-on-ubuntu-16-04#prerequisites)).

  Install PostgreSQL and start PostgreSQL server:
<pre>
$ sudo apt-get install postgresql postgresql-contrib libpq-dev
$ sudo service postgresql start
</pre>

**macOS**

  Install ruby and Rails using homebrew and rbenv (see [here](https://www.gorails.com/setup/osx/10.12-sierra)).

  Install PostgreSQL and start PostgreSQL server with homebrew:
<pre>
$ brew install postgresql
$ brew services start postgresql
</pre>

### Python

**Debian Linux**

<pre>
$ sudo apt-get install build-essential python-dev python-pip
$ pip install numpy
</pre>

  Check that python version is between 2.7.0 and 3.0.0:
<pre>
$ python -V
</pre>

**macOS**

  If not done yet, install Homebrew:
<pre>
$ ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
</pre>

  Install python 2.7 with Homebrew:
<pre>
$ brew install python
</pre>

  Check that python version is between 2.7.0 and 3.0.0:
<pre>
$ python -V
</pre>

### R

**Debian Linux**

<pre>
$ sudo apt install r-base-core
</pre>

  Open the R environment and check that R version is above 3.2.2:
<pre>
$ R
> R.version.string
</pre>

**macOS**

  Update XQuartz and Xcode if needed.

  Download the R binary from cran at <https://cran.r-project.org/bin/macosx>.
  Click on the downloaded .pkg file and follow the instructions.

### R dependencies

Install required R packages from CRAN and bioconductor:

*Note: Each package can be installed separately. If RcppEigen fails to compile, allocate more memory.*
<pre>
$ sudo R
> install.packages(c("ineq", "rjson", "fpc", "multcomp", "FactoMineR", "colorspace", "vegan", "optparse", "gplots", "igraph", "fossil", "coin", "SNFtool"))
> source("https://bioconductor.org/biocLite.R")
> biocLite("sva")
> q()
</pre>

In case of issue with igraph installation:
<pre>
> install.packages("devtools")
> library(devtools)
> install_github("igraph/rigraph")
</pre>

### Genocrunch web application

  Create an empty rails project:
<pre>
$ rails new genocrunch -d postgresql -B
</pre>

  Set the git repository:
<pre>
$ cd genocrunch
$ git init
$ git remote add origin https://c4science.ch/source/genocrunch-2.1.git
</pre>

  Get a copy of genocrunch files:
<pre>
$ git fetch --all
$ git reset --hard origin/master
</pre>

  Set the <code>.gitignore</code> file:

<pre>
$ cp gitignore.keep .gitignore
</pre>

  Run the <code>install.sh</code> script:
<pre>
$ cd /path/to/genocrunch
$ chmod 755 install.sh
$ ./install.sh
</pre>
  This simply uses the .bashrc or .bashprofile to include executable analysis scripts in the PATH.

  Source .bashrc (or .bash_profile on macOS):
<pre>
$ source .bashrc  # for macOS replace .bashrc by .bash_profile
</pre>

**Additional steps for macOS**

  Install the coreutils package with homebrew:
<pre>
$ brew install coreutils
</pre>

### Ruby libraries (gems)

  Use the Gemefile to install required gems:
<pre>
$ cd /path/to/genocrunch
$ bundle install
</pre>

  A function in the activesupport library may cause the following error at creation of a job: <code>undefined method `to_datetime' for false:FalseClass</code>. This can be fixed by editing its <code>calculations.rb</code> file as described [here](http://stackoverflow.com/questions/36805639/rails-3-2-to-4-0-upgrade-undefined-method-to-datetime-for-falsefalseclass)):
  Replace the <code>calculations.rb</code> file by a fixed copy:

**Debian Linux**

<pre>
$ wget https://raw.githubusercontent.com/alexisrapin/fix/master/calculations.rb -O ~/.rbenv/versions/2.3.1/lib/ruby/gems/2.3.0/gems/activesupport-4.0.0/lib/active_support/core_ext/date_time/calculations.rb
</pre>

**macOS**

<pre>
$ curl "https://raw.githubusercontent.com/alexisrapin/fix/master/calculations.rb" -o ~/.rbenv/versions/2.3.1/lib/ruby/gems/2.3.0/gems/activesupport-4.0.0/lib/active_support/core_ext/date_time/calculations.rb
</pre>

### Set application configuration variables

  Set the application configuration variables in the genocrunch/config/config.yml file to fit the current installation:

<pre>
$ cd /path/to/genocrunch
$ cp config/config.yml.keep config/config.yml
</pre>

<pre>
#config/config.yml

development:
  # Genocrunch main directory
  data_dir: /path/to/genocrunch

  # Additional link(s) that should be included in the Infos menu of the topbar
  info_links: [{name: 'link_name', href: 'link_url', target: '_blank'}]

  # Webmaster email
  webmaster_email: 'webmaster_email'

  # Send a validation link to user email to confirm registration?
  user_confirmable: false

production:
  data_dir: /path/to/genocrunch
  info_links: [{name: 'link_name', href: 'link_url', target: '_blank'}]
  webmaster_email: 'webmaster_email'
  user_confirmable: false
</pre>

### Set genocrunch emails

  Set the email details that will be used by Genocrunch to send information such as registration confirmation link or password recovery link to users.
The following example would set Genocrunch to use an hypothetical gmail address (app_email@gmail.com) in development.

<pre>
$ cd /path/to/genocrunch
$ cp config/initializers/devise.rb.keep config/initializers/devise.rb
$ cp config/environments/development.rb.keep config/environments/development.rb
</pre>

<pre>
#config/initializers/devise.rb

Devise.setup do |config|
  ...
  config.mailer_sender = "app_email@gmail.com"
  ...
</pre>

<pre>
#config/environments/development.rb

Rails.application.configure do
  ...
  config.action_mailer.default_url_options = { :host => 'localhost:3000' }
  config.action_mailer.smtp_settings = {
    :address => "smtp.gmail.com",
    :port => 587,
    :domain => "mail.google.com",
    :user_name => "app_email@gmail.com",
    :password => "app_email_password",
    :authentication => :plain,
    :enable_starttls_auto => true
  }
  ...
</pre>

### Setup the PostgreSQL server

  Create a new role and a new database (you can create different users and databases for development, test and/or production):

<pre>
$ sudo su postgres  # for macOS, replace postgres by _postgres
$ psql
postgres=# CREATE ROLE myusername WITH LOGIN PASSWORD 'mypassword';
postgres=# CREATE DATABASE my_application_db_name OWNER myusername;
postgres=# \q
$ exit
</pre>

  Set the genocrunch/config/database.yml file:
  In development, test and/or production sections, set the <code>database</code>, <code>username</code> and <code>password</code> to fit the corresponding PostgreSQL database:

<pre>
$ cd /path/to/genocrunch
$ cp config/database.yml.keep config/database.yml
</pre>

<pre>
#config/database.yml

...
database: my_application_db_name
...
username: myusername
...
password: mypassword
...
</pre>

### Initialize the database

Two default users will be created: guest and admin. The guest user is required to try the application without registering/signing-in. The admin user is optional.
Change the default passwords and emails.
This can be done after seeding the database, with psql or prior to seeding the database, in the genocrunch/db/seeds.rb file:

<pre>
$ cp /path/to/genocrunch/db/seeds.rb.keep /path/to/genocrunch/db/seeds.rb
</pre>

<pre>
#db/seeds.rb

User.create!([{username: 'guest',
               role: 'guest',
               email: 'guest@guestmailbox.com', # <- HERE
               confirmed_at: '2017-01-01 00:00:00.000000',
               password: 'guest_account_password'}, # <- HERE
              {username: 'admin',
               role: 'admin',
               email: 'admin@adminmailbox.com', # <- HERE
               confirmed_at: '2017-01-01 00:00:00.000000',
               password: 'admin_account_password'}]) # <- AND THERE
...
</pre>

Run the folowing commands to create and seed the database.
This would erase previous database tables. Use it for installation, not update.
For updates, use migrations. 

<pre>
$ cd /path/to/genocrunch
$ rake db:schema:load
$ rake db:seed
</pre>

To set users emails and password after seeding:
<pre>
$ psql db_name
db_name=# update users set email = 'guest_email' where username = 'guest';
db_name=# update users set password = 'guest_password' where username = 'guest';
db_name=# update users set email = 'admin_email' where username = 'admin';
db_name=# update users set password = 'admin_password' where username = 'admin';
</pre>

### Run the Rails server

  * Development mode
<pre>
$ cd /path/to/genocrunch
$ rails server
</pre>

You can now access the application in your browser at <code>http://localhost:3000</code> on your machine and <code>your_ip_address:3000</code> on your network.

*By default, the server runs in development mode.*

  * Production mode

This section is under construction.

### Start workers

  * Prefered way:
<pre>
$ cd /path/to/genocrunch
$ RAILS_ENV=development bin/delayed_job -n 2  start
</pre>
OR
<pre>
$ cd /path/to/genocrunch
$ RAILS_ENV=development bin/delayed_job -n 2 restart
</pre>

  * Alternative way:
<pre>
$ cd /path/to/genocrunch
$ rake jobs:work
</pre>

You can now create new jobs (run analysis).
Read the documentation (<code>http://localhost:3000/home/doc</code>) for details.

### Create a new version

Versions of installed R packages can be referenced in the version page (<code>http://localhost:3000/versions</code>).
For this, run the <code>get_version.py</code> script:
<pre>
$ cd /path/to/genocrunch
$ get_version.py
</pre>
This will create a .json file in the genocrunch main directory with a name looking like <code>version_2017-12-18_18:03:08.898906.json</code>.

Sign in as admin and navigate to Infos>Versions
Click on the <b>New Version</b> button and fill the form.
In the JSON field, copy the json string contained in the .json file previously created using the <code>get_version.py</code> script.
Finally, click on the <code>Create Version</code> button.

### Terms of service

Terms of service can be edited in /path/to/genocrunch/public/app/TERMS_OF_SERVICE.txt

## Usage

See Infos>Doc in the application web page (<code>http://localhost:3000/home/doc</code>).
