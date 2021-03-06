# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema.define(version: 20180528202115) do

  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  create_table "delayed_jobs", force: :cascade do |t|
    t.integer  "priority",   default: 0, null: false
    t.integer  "attempts",   default: 0, null: false
    t.text     "handler",                null: false
    t.text     "last_error"
    t.datetime "run_at"
    t.datetime "locked_at"
    t.datetime "failed_at"
    t.string   "locked_by"
    t.string   "queue"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.index ["priority", "run_at"], name: "delayed_jobs_priority", using: :btree
  end

  create_table "examples", force: :cascade do |t|
    t.text     "job_key"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "jobs", force: :cascade do |t|
    t.boolean  "sandbox",      default: true
    t.integer  "user_id",      default: 1
    t.string   "name"
    t.string   "key"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.string   "status",       default: "pending"
    t.text     "form_json"
    t.text     "output_json"
    t.text     "description"
    t.integer  "pmid"
    t.text     "read_access"
    t.text     "write_access"
    t.integer  "size",         default: 0
  end

  create_table "statuses", force: :cascade do |t|
    t.text    "name"
    t.text    "filename"
    t.integer "precedence"
    t.text    "icon"
  end

  create_table "users", force: :cascade do |t|
    t.string   "username",               default: "",        null: false
    t.string   "email",                  default: "",        null: false
    t.string   "encrypted_password",     default: "",        null: false
    t.string   "reset_password_token"
    t.string   "confirmation_token"
    t.datetime "reset_password_sent_at"
    t.datetime "remember_created_at"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.datetime "confirmed_at"
    t.datetime "confirmation_sent_at"
    t.string   "unconfirmed_email"
    t.integer  "sign_in_count",          default: 0
    t.datetime "current_sign_in_at"
    t.datetime "last_sign_in_at"
    t.string   "current_sign_in_ip"
    t.string   "last_sign_in_ip"
    t.string   "role",                   default: "user"
    t.integer  "storage_quota",          default: 500000000
    t.integer  "total_jobs_size",        default: 0
    t.index ["username"], name: "index_users_on_username", unique: true, using: :btree
  end

  create_table "versions", force: :cascade do |t|
    t.text     "description"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.datetime "release_date"
    t.text     "tools_json"
  end

  create_table "views", force: :cascade do |t|
    t.text    "name"
    t.text    "category"
    t.text    "icon"
    t.integer "position"
    t.boolean "graphical",	default: "true"
    t.text    "data_format",	default: "json"
  end

end
