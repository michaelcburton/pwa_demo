# Pin npm packages by running ./bin/importmap

pin "application"
pin "@hotwired/turbo-rails", to: "turbo.min.js"
pin "@hotwired/stimulus", to: "stimulus.min.js"
pin "@hotwired/stimulus-loading", to: "stimulus-loading.js"
pin_all_from "app/javascript/controllers", under: "controllers"
pin "indexeddb", to: "indexeddb.js"
pin "sync", to: "sync.js"
pin "companion", to: "companion.js"
pin "network", to: "network.js"