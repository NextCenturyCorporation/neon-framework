module.exports = function(grunt) {
  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON("package.json"),
    concat: {
      dist: {
        src: [
          "src/intro.js",
          "src/util/loggerUtils.js",
          "src/util/owfUtils.js",
          "src/eventing/owf/*.js",
          "src/config.js",
          "src/eventing/*.js",
          "src/query/*.js",
          "src/ready.js",
          "src/util/*.js",
          "src/widget/*.js"
        ],
        dest: "dist/neon.js"
      },
      options: {
        stripBanners: {
          block: true,
          line: true
        }
      }
    },
    umd: {
      dist: {
        src: ["dist/neon.js"],
        dest: "dist/neon.js"
      },
      options: {
        deps: {
          default: [
            "log4javascript",
            "postal",
            { lodash: "_" },
            { jquery: "$" },
            { "node-uuid": "uuid" }
          ]
        },
        objectToExport: "neon"
      }
    }
  });

  grunt.loadNpmTasks("grunt-contrib-concat");
  grunt.loadNpmTasks("grunt-umd");

  // Default task(s).
  grunt.registerTask("default", ["concat", "umd"]);
};
