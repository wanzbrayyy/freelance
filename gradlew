#!/usr/bin/env sh

#
# Copyright 2015 the original author or authors.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#

##############################################################################
##
##  Gradle start up script for UN*X
##
##############################################################################

# Attempt to set APP_HOME
# Resolve links: $0 may be a link
PRG="$0"
# Need this for relative symlinks.
while [ -h "$PRG" ] ; do
    ls=`ls -ld "$PRG"`
    link=`expr "$ls" : '.*-> \(.*\)$'`
    if expr "$link" : '/.*' > /dev/null; then
        PRG="$link"
    else
        PRG=`dirname "$PRG"`"/$link"
    fi
done
SAVED="`pwd`"
cd "`dirname \"$PRG\"`/" >/dev/null
APP_HOME="`pwd -P`"
cd "$SAVED" >/dev/null

APP_NAME="Gradle"
APP_BASE_NAME=`basename "$0"`

# Add default JVM options here. You can also use JAVA_OPTS and GRADLE_OPTS to pass JVM options to this script.
DEFAULT_JVM_OPTS=""

# Use the maximum available, or set MAX_FD != -1 to use that value.
MAX_FD="maximum"

# For Darwin, add options to specify how the application appears in the dock
if [ `uname -s` = "Darwin" ]; then
    GRADLE_OPTS="$GRADLE_OPTS -Xdock:name=\"$APP_NAME\" -Xdock:icon=\"$APP_HOME/media/gradle.icns\""
fi

# OS specific support (must be 'true' or 'false').
cygwin=false
msys=false
darwin=false
case "`uname`" in
  CYGWIN* )
    cygwin=true
    ;;
  Darwin* )
    darwin=true
    ;;
  MINGW* )
    msys=true
    ;;
esac

# Attempt to fully resolve JAVA_HOME
if [ -n "$JAVA_HOME" ] ; then
    if [ -d "$JAVA_HOME" ] ; then
        if [ -x "$JAVA_HOME/jre/sh/java" ] ; then
            # IBM's JDK on AIX uses strange locations for the executables
            export JAVA_HOME
        elif [ ! -d "$JAVA_HOME/bin" ] ; then
            # HPUX
            if [ -x "$JAVA_HOME/jre/bin/java" ] ; then
                export JAVA_HOME
            fi
        fi
    fi
fi
if [ -n "$JAVA_HOME" ] ; then
    if [ ! -d "$JAVA_HOME" ] ; then
        echo "Warning: JAVA_HOME environment variable is not a directory: $JAVA_HOME" 1>&2
    fi
fi

# Find java
if [ -n "$JAVA_HOME" ] ; then
    if [ -x "$JAVA_HOME/jre/sh/java" ] ; then
        # IBM's JDK on AIX uses strange locations for the executables
        JAVACMD="$JAVA_HOME/jre/sh/java"
    else
        JAVACMD="$JAVA_HOME/bin/java"
    fi
else
    JAVACMD="java"
fi

if [ ! -x "$JAVACMD" ] ; then
  echo "Error: JAVA_HOME is not defined correctly." 1>&2
  echo "  We cannot execute $JAVACMD" 1>&2
  exit 1
fi

# Increase the maximum file descriptors if we can.
if [ "$cygwin" = "false" -a "$darwin" = "false" ] ; then
    MAX_FD_LIMIT=`ulimit -H -n`
    if [ $? -eq 0 ] ; then
        if [ "$MAX_FD" = "maximum" -o "$MAX_FD" = "max" ] ; then
            # Use the system limit
            MAX_FD="$MAX_FD_LIMIT"
        fi
        ulimit -n $MAX_FD
        if [ $? -ne 0 ] ; then
            echo "Could not set maximum file descriptor limit: $MAX_FD" 1>&2
        fi
    else
        echo "Could not query system maximum file descriptor limit: $MAX_FD_LIMIT" 1>&2
    fi
fi

# Collect all arguments for the java command, following recommended practice of separating jvm and main class args.
#
# Add -server to the JVM options, if available.
if "$JAVACMD" -server -version >/dev/null 2>&1 ; then
    DEFAULT_JVM_OPTS="$DEFAULT_JVM_OPTS -server"
fi

GRADLE_JAVA_OPTS=
while [ "$1" != "" ]
do
    case "$1" in
      -D*)
          GRADLE_JAVA_OPTS="$GRADLE_JAVA_OPTS $1"
          shift
          ;;
      -d | --debug)
          GRADLE_OPTS="$GRADLE_OPTS $1"
          shift
          ;;
      --debug-jvm)
          GRADLE_OPTS="$GRADLE_OPTS $1"
          shift
          ;;
      -*)
          # Other options are passed to the gradle command.
          break
          ;;
      *)
          # The first non-option is the start of the gradle command.
          break
          ;;
    esac
done

# Split up --daemon and --no-daemon, so that we can pass them to the correct command.
# The --daemon option is consumed by the launcher script, and the --no-daemon option is passed to the build.
NO_DAEMON_COMMAND_LINE_OPTION=
LAUNCH_COMMAND_LINE_OPTION=
while [ "$1" != "" ]
do
    case "$1" in
      --no-daemon)
          NO_DAEMON_COMMAND_LINE_OPTION="$1"
          shift
          ;;
      --daemon)
          LAUNCH_COMMAND_LINE_OPTION="$1"
          shift
          ;;
      *)
          break
          ;;
    esac
done

# Check that the --daemon and --no-daemon options have not been specified together.
if [ -n "$LAUNCH_COMMAND_LINE_OPTION" -a -n "$NO_DAEMON_COMMAND_LINE_OPTION" ] ; then
    echo "Error: The --daemon and --no-daemon options cannot be specified together." 1>&2
    exit 1
fi

# The remaining arguments are passed to the gradle command.
GRADLE_CMD_LINE_ARGS="$NO_DAEMON_COMMAND_LINE_OPTION $@"

CLASSPATH="$APP_HOME/gradle/wrapper/gradle-wrapper.jar"

# Determine the Java command to use to start the JVM.
if [ -n "$JAVA_HOME" ] ; then
    if [ -x "$JAVA_HOME/jre/sh/java" ] ; then
        # IBM's JDK on AIX uses strange locations for the executables
        JAVACMD="$JAVA_HOME/jre/sh/java"
    else
        JAVACMD="$JAVA_HOME/bin/java"
    fi
else
    JAVACMD="java"
fi

# Escape arguments with spaces.
# This is done using an array so that we can concatenate the arguments again with spaces,
# but using an array avoids issues with spaces in arguments.
# A plain string would require us to escape the spaces in the arguments, which is harder.
JAVA_OPTS_ARRAY=()
for arg in $DEFAULT_JVM_OPTS $JAVA_OPTS $GRADLE_OPTS $GRADLE_JAVA_OPTS; do
    JAVA_OPTS_ARRAY[${#JAVA_OPTS_ARRAY[*]}]="$arg"
done

# Add the --daemon option to the command line if necessary.
if [ -n "$LAUNCH_COMMAND_LINE_OPTION" ] ; then
    # Add the --daemon option to the gradle command.
    GRADLE_CMD_LINE_ARGS="$LAUNCH_COMMAND_LINE_OPTION $GRADLE_CMD_LINE_ARGS"
fi

# Add the launcher options to the command line.
GRADLE_CMD_LINE_ARGS="-Dorg.gradle.appname=$APP_BASE_NAME $GRADLE_CMD_LINE_ARGS"

# Now execute the command
exec "$JAVACMD" "${JAVA_OPTS_ARRAY[@]}" -classpath "$CLASSPATH" org.gradle.wrapper.GradleWrapperMain $GRADLE_CMD_LINE_ARGS