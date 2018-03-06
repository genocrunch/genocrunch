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
- **Documentation:** <https://c4science.ch/source/genocrunch-2.1>
- **Licence:** <https://www.gnu.org/licenses/agpl-3.0.md>
- **Dockerfile:** <https://c4science.ch/source/genocrunch_docker>

## Framework

Genocrunch uses the ruby on Rails framework with a PostgreSQL database.

## Supported platforms

- **Linux** (tested on Ubuntu 16.04 LTS and CentOS 7)
- **macOS** (tested on 10.12 Sierra)

## Supported web browsers

- **Mozilla Firefox** (Mobile versions are not supported)

## Requirements

- **Ruby version 2.3.1**
- **Rails version 5.0.0**
- **Python version >=2.7.0 <3.0.0**
- **R version >3.2.2**

## Installation (Debian Linux and macOS)

### Ruby, Rails and PostgreSQL

**Debian Linux**

Uninstall possible pre-installed versions of ruby:

```
$ sudo apt-get purge ruby
```

(Re-)install ruby and Rails using rbenv (see [here](https://www.digitalocean.com/community/tutorials/how-to-install-ruby-on-rails-with-rbenv-on-ubuntu-16-04#prerequisites)).

Install PostgreSQL and start PostgreSQL server:

```
$ sudo apt-get install postgresql postgresql-contrib libpq-dev
$ sudo service postgresql start
```

**macOS**

Install ruby and Rails using homebrew and rbenv (see [here](https://www.gorails.com/setup/osx/10.12-sierra)).

Install PostgreSQL and start PostgreSQL server with homebrew:

```
$ brew install postgresql
$ brew services start postgresql
```

### Python

**Debian Linux**

```
$ sudo apt-get install build-essential python-dev python-pip
$ pip install numpy
```

Check that python version is between 2.7.0 and 3.0.0:

```
$ python -V
```

**macOS**

If not done yet, install Homebrew:

```
$ ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
```

Install python 2.7 with Homebrew:

```
$ brew install python
```

Check that python version is between 2.7.0 and 3.0.0:

```
$ python -V
```

### R

**Debian Linux**

```
$ sudo apt-get install r-base-core
```

Open the R environment and check that R version is above 3.2.2:

```
$ R
> R.version.string
```

**macOS**

Update XQuartz and Xcode if needed.

Download the R binary from CRAN at <https://cran.r-project.org/bin/macosx>.
Click on the downloaded .pkg file and follow the instructions.

### R dependencies

Install required R packages from CRAN and bioconductor:

**Note: Each package can be installed separately. If RcppEigen fails to compile, allocate more memory.**

```
$ sudo R
> install.packages(c("ineq", "rjson", "fpc", "multcomp", "FactoMineR", "colorspace", "vegan", "optparse", "gplots", "igraph", "fossil", "coin", "SNFtool"))
> source("https://bioconductor.org/biocLite.R")
> biocLite("sva")
> q()
```

In case of issue with igraph installation:

```
> install.packages("devtools")
> library(devtools)
> install_github("igraph/rigraph")
```

### Genocrunch web application

Create an empty rails project:

```
$ rails new genocrunch -d postgresql -B
```

Set the git repository:

```
$ cd genocrunch
$ git init
$ git remote add origin https://c4science.ch/source/genocrunch-2.1.git
```

Get a copy of genocrunch files:

```
$ git fetch --all
$ git reset --hard origin/master
```

  Set the `.gitignore` file:

```
$ cp gitignore.keep .gitignore
```

Run the `install.sh` script (this is not essential for the application):

```
$ cd /path/to/genocrunch
$ chmod 755 install.sh
$ ./install.sh
```

This simply uses the `.bashrc` or `.bashprofile` to include executable analysis scripts fro `lib/genocrunch_console` in `$PATH`.

```
$ source .bashrc  # for macOS replace .bashrc by .bash_profile
```

**Additional steps for macOS**

Install the coreutils package with homebrew:

```
$ brew install coreutils
```
### Ruby libraries (gems)

Use the Gemefile to install required gems:

```
$ cd /path/to/genocrunch
$ bundle install
```

You can customize the message appearing when a table is empty here:
```
$ cp ~/.rbenv/versions/*/lib/ruby/gems/*/gems/jquery-datatables-rails-*/app/assets/javascripts/dataTables/jquery.dataTables.js ~/.rbenv/versions/*/lib/ruby/gems/*/gems/jquery-datatables-rails-*/app/assets/javascripts/dataTables/jquery.dataTables.js.bkp
$ sed -i -e 's/No data available in table/This table is empty/g' ~/.rbenv/versions/*/lib/ruby/gems/*/gems/jquery-datatables-rails-*/app/assets/javascripts/dataTables/jquery.dataTables.js
```


### Set application configuration variables

Set the application configuration variables in the `genocrunch/config/config.yml` file to fit the current installation:

```
$ cd /path/to/genocrunch
$ cp config/config.yml.keep config/config.yml
```

```
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
```

### Set genocrunch emails

Set the email details that will be used by Genocrunch to send information such as registration confirmation link or password recovery link to users.
The following example would set Genocrunch to use an hypothetical gmail address (`app_email@gmail.com`) in development.

```
$ cd /path/to/genocrunch
$ cp config/initializers/devise.rb.keep config/initializers/devise.rb
$ cp config/environments/development.rb.keep config/environments/development.rb
```

```
#config/initializers/devise.rb

Devise.setup do |config|
  ...
  config.mailer_sender = "app_email@gmail.com"
  ...
```

```
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
```

### Setup the PostgreSQL server

Create a new role and a new database (you can create different users and databases for development, test and/or production):

```
$ sudo su postgres  # for macOS, replace postgres by _postgres
$ psql
postgres=# CREATE ROLE myusername WITH LOGIN PASSWORD 'mypassword';
postgres=# CREATE DATABASE my_application_db_name OWNER myusername;
postgres=# \q
$ exit
```

Set the `genocrunch/config/database.yml` file:
In development, test and/or production sections, set the `database`, `username` and `password` to fit the corresponding PostgreSQL database:

```
$ cd /path/to/genocrunch
$ cp config/database.yml.keep config/database.yml
```

```
#config/database.yml

...
database: my_application_db_name
...
username: myusername
...
password: mypassword
...
```

### Initialize the database

Two default users will be created: guest and admin. The guest user is required to try the application without registering/signing-in. The admin user is optional.
Change the default passwords and emails.
This can be done after seeding the database, with psql or prior to seeding the database, in the `genocrunch/db/seeds.rb` file:

```
$ cp /path/to/genocrunch/db/seeds.rb.keep /path/to/genocrunch/db/seeds.rb
```

```
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
```

Run the folowing commands to create and seed the database.
This would erase previous database tables. Use it for installation, not update.
For updates, use migrations. 

```
$ cd /path/to/genocrunch
$ rake db:schema:load
$ rake db:seed
```

To set users emails and password after seeding:

```
$ psql db_name
db_name=# update users set email = 'guest_email' where username = 'guest';
db_name=# update users set password = 'guest_password' where username = 'guest';
db_name=# update users set email = 'admin_email' where username = 'admin';
db_name=# update users set password = 'admin_password' where username = 'admin';
```

### Run the Rails server

  * Development mode

```
$ cd /path/to/genocrunch
$ rails server
```

You can now access the application in your browser at <http://localhost:3000> on your machine and `your_ip_address:3000` on your network.

**By default, the server runs in development mode.**

  * Production mode

This section is under construction.

### Start workers

  * Prefered way:

```
$ cd /path/to/genocrunch
$ RAILS_ENV=development bin/delayed_job -n 2  start
```

OR

```
$ cd /path/to/genocrunch
$ RAILS_ENV=development bin/delayed_job -n 2 restart
```

  * Alternative way:

```
$ cd /path/to/genocrunch
$ rake jobs:work
```

You can now create new jobs (run analysis).
Read the documentation (<http://localhost:3000/home/doc>) for details.

### Create a new version

Versions of installed R packages can be referenced in the version page (<http://localhost:3000/versions>).
For this, run the `get_version.py` script:

```
$ cd /path/to/genocrunch
$ get_version.py
```

This will create a .json file in the genocrunch main directory with a name looking like `version_2017-12-18_18:03:08.898906.json`.

Sign in as admin and navigate to Infos>Versions
Click on the **New Version** button and fill the form.
In the JSON field, copy the json string contained in the .json file previously created using the `get_version.py` script.
Finally, click on the **Create Version** button.

### Terms of service

Terms of service can be edited in `/path/to/genocrunch/public/app/TERMS_OF_SERVICE.txt`.

## Usage

See **Infos>Doc** in the application web page (<http://localhost:3000/home/doc>).

## Running on Docker

See [here](https://c4science.ch/source/genocrunch_docker).
