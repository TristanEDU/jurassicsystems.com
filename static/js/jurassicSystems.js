(function($, sm) {
  const jpTerminal = (function() {
    const env = {
      accessAttempts: 0,
      active: null,
      commands: {},
      maxIndex: 1,
      musicOn: false,
      park: {
        doorsLocked: true,
        fencesOnline: true,
        phonesOnline: true,
        tourRunning: true,
        lysineContingency: false,
        selectedSector: 'visitor',
        sectors: {
          visitor: { name: 'Visitor Center', status: 'SECURE', note: 'main rotunda and lab access nominal' },
          raptor: { name: 'Raptor Pen', status: 'CAUTION', note: 'motion sensors report perimeter pacing' },
          trex: { name: 'T-Rex Paddock', status: 'SECURE', note: '10,000 volt fence armed' },
          sauropod: { name: 'Sauropod Swamp', status: 'SECURE', note: 'herd cameras online' },
          dock: { name: 'East Dock', status: 'SECURE', note: 'storm beacon and winch available' },
          control: { name: 'Control Room', status: 'SECURE', note: 'Unix mainframe awaiting commands' },
        },
      },
      sounds: {},
    };
    const api = {};

    api.buildCommandLine = function(line) {
      const commandName = line.trim().split(/ /)[0];
      const command =
        env.commands[commandName] &&
        env.commands[commandName].command;

      env.active.find('.command-history')
        .append($('<div class="entered-command">')
        .text('> ' + line));

      if (command) {
        command(env, line);
      } else if (commandName) {
        env.active.find('.command-history')
          .append($('<div>').text(commandName + ': command not found'));
      }
    }

    api.addCommand = function(details) {
      if (
        details.name &&
        !env.commands.hasOwnProperty(details.name) &&
        (details.command.constructor === Function)
      ) {
        env.commands[details.name] = details;
      }
    }

    api.setActive = function(active) {
      env.active = $(active) || env.active;
    }

    api.getActive = function() {
      return env.active;
    }

    api.getEnvironment = function() {
      return env;
    }

    api.nextIndex = function() {
      return ++env.maxIndex;
    }

    api.init = function() {
      // HTML5 audio element detection
      if (Modernizr.audio.mp3 || Modernizr.audio.wav || Modernizr.audio.ogg) {
        const beepHTML5 = $('<audio preload="auto"/>');
        const lockDownHTML5 = $('<audio preload="auto"/>');
        const dennisMusicHTML5 = $('<audio preload="auto"/>');

        beepHTML5.append('<source src="snd/beep.ogg">');
        beepHTML5.append('<source src="snd/beep.mp3">');
        beepHTML5.append('<source src="snd/beep.wav">');

        lockDownHTML5.append('<source src="snd/lockDown.ogg">');
        lockDownHTML5.append('<source src="snd/lockDown.mp3">');
        lockDownHTML5.append('<source src="snd/lockDown.wav">');

        dennisMusicHTML5.append('<source src="snd/dennisMusic.ogg">');
        dennisMusicHTML5.append('<source src="snd/dennisMusic.mp3">');
        dennisMusicHTML5.append('<source src="snd/dennisMusic.wav">');

        env.sounds.beep = {
          play: function() {
            beepHTML5[0].load();
            beepHTML5[0].play();
          }
        };

        env.sounds.lockDown = {
          play: function() {
            lockDownHTML5[0].load();
            lockDownHTML5[0].play();
          }
        };

        env.sounds.dennisMusic = {
          play: function() {
            dennisMusicHTML5[0].load();
            dennisMusicHTML5[0].play();
          },
          stop: function() {
            dennisMusicHTML5[0].pause();
          },
        };

        dennisMusicHTML5.bind('ended', function() {
          env.sounds.dennisMusic.play();
        });
      }  else {
        sm.setup({ 
          url: 'swf/soundManager/',
          onready: function() {
            env.sounds.beep = sm.createSound({
              autoLoad: true,
              id: 'beep',
              url: 'snd/beep.mp3',
            });

            env.sounds.lockDown = sm.createSound({
              autoLoad: true,
              id: 'lockDown',
              url: 'snd/lockDown.mp3',
            });

            env.sounds.dennisMusic = sm.createSound({
              autoLoad: true,
              id: 'dennisMusic',
              onfinish: function() {
                sm.play('dennisMusic');
              },
              url: 'snd/dennisMusic.mp3',
            });
          },
        });
      }
    };

    return api;
  }());

  jpTerminal.init();
  jpTerminal.setActive('#main-terminal');


  const appendMain = function(content) {
    $('#main-input').append(content);
    const wrap = $('#main-inner');
    wrap.scrollTop(wrap[0].scrollHeight);
  };

  const setSectorStatus = function(env, sector, status, note) {
    if (!env.park.sectors[sector]) {
      return false;
    }
    env.park.sectors[sector].status = status;
    if (note) {
      env.park.sectors[sector].note = note;
    }
    updateParkDisplay(env);
    return true;
  };

  const updateParkDisplay = function(env) {
    const park = env.park;
    $('.sector').each(function() {
      const key = $(this).data('sector');
      const sector = park.sectors[key];
      $(this)
        .toggleClass('selected', key === park.selectedSector)
        .toggleClass('offline', sector.status !== 'SECURE');
    });

    const selected = park.sectors[park.selectedSector];
    $('#map-readout').html(
      '<strong>' + selected.name + '</strong><br>' +
      'STATUS: ' + selected.status + '<br>' +
      selected.note
    );

    const insecure = Object.keys(park.sectors)
      .filter(function(key) { return park.sectors[key].status !== 'SECURE'; });
    let alertText = 'PARK SYSTEMS NOMINAL';
    let alertClass = '';

    if (!park.fencesOnline || insecure.length > 2) {
      alertText = 'PARK WIDE EMERGENCY';
      alertClass = 'danger';
    } else if (insecure.length || !park.phonesOnline || !park.tourRunning) {
      alertText = 'SYSTEM WARNING';
      alertClass = 'warning';
    }

    $('#park-alert').attr('class', alertClass).text(alertText);
  };

  jpTerminal.addCommand({
    name: 'music',
    summary: 'turn background music on or off',
    manPage: 'SYNOPSIS\n' + 
             '\tmusic [on|off]\n\n' + 
             'DESCRIPTION\n' + 
             '\tManage the state of the \'Dennis Steals the Embryo\' ' +
             'music. Use the \'on\' state for\n\tincreased epicness.\n\n' +
             'AUTHOR\n' +
             '\tWritten by <a href="https://tully.io">Tully Robinson</a>.\n',
    command: function(env, inputLine) {
      const arg = inputLine.trim().split(/ +/)[1] || '';
      const output = $('<span/>').text('music: must specify state [on|off]');

      if (!arg || !arg.match(/^(?:on|off)$/i)) {
        $('#main-input').append(output);
      } else {
        if (arg.toLowerCase() === 'on') {
          if (!env.musicOn) {
            env.sounds.dennisMusic.play();
          }
          env.musicOn = true;
        } else if (arg.toLowerCase() === 'off') {
          env.sounds.dennisMusic.stop();
          env.musicOn = false;
        }
      }
    },
  });

  jpTerminal.addCommand({
    name: 'access', 
    summary: 'access a target environment on the Jurassic Systems grid',
    manPage: 'SYNOPSIS\n' +
             '\taccess [SYSTEM_NAME] [MAGIC_WORD]\n\n' +
             'DESCRIPTION\n' + 
             '\tGain read and write access to a specified environment.\n\n' +
             'AUTHOR\n' +
             '\tWritten by Dennis Nedry.\n',
    command: function(env, inputLine) {
      const output = $('<span>').text('access: PERMISSION DENIED.');
      const arg = inputLine.split(/ +/)[1] || '';
      const magicWord =
        inputLine.substring(inputLine.trim().lastIndexOf(' ')) || '';

      if (arg === '') {
        $('#main-input').append($('<span/>')
          .text('access: must specify target system'));

        return;
      } else if (
        inputLine.split(' ').length > 2 &&
        magicWord.trim() === 'please'
      ) {
        $('#main-input')
          .append($('<img id="asciiNewman" src="img/asciiNewman.jpg" />'));
        $('#asciiNewman').load(function() {
          const wrap = $('.inner-wrap', env.active);
          wrap.scrollTop(wrap[0].scrollHeight);
        });

        return;
      }

      $('#main-input').append(output);
      env.sounds.beep.play();

      if (++env.accessAttempts >= 3) {
        const andMessage = $('<span>').text('...and...');
        let errorSpam;

        $('.irix-window').unbind('keydown');
        $('#main-prompt').addClass('hide');

        setTimeout(function() {
          $('#main-input').append(andMessage);
        }, 200);

        setTimeout(function() {
          env.sounds.lockDown.play();
        }, 1000);

        setTimeout(function() {
          $('#environment').animate(
            {'left': '+=3000'},
            2000,
            function() {
              setTimeout(function() {
                const theKingVideo = document.getElementById('the-king-video');

                errorSpam != null && clearInterval(errorSpam);
                theKingVideo != null && theKingVideo.play();
                $('#irix-desktop').hide();
                $('#mac-hd-window').css('background-image', 'url(img/macHDBlur.jpg)');
                $('#the-king-window').show();

                setTimeout(function() {
                  $('#home-key').css('z-index', '64000');
                }, 10000);
              }, 2000);
            },
          );
        }, 4000);

        setTimeout(function() {
          errorSpam = setInterval(function() {
            var errorMessage = $('<div>YOU DIDN\'T SAY THE MAGIC WORD!</div>');
            $('#main-input').append(errorMessage);
            $('#main-inner').scrollTop($('#main-inner')[0].scrollHeight);
          }, 50);
        }, 1000);
      }
    }
  });

  jpTerminal.addCommand({
    name: 'system',
    summary: 'check a system\'s current status',
    manPage: 'SYNOPSIS\n' +
             '\tsystem [SYSTEM_NAME]\n\n' +
             'DESCRIPTION\n' +
             '\tCheck the input system and return each sector\'s ' +
             'current status.\n\n' +
             'AUTHOR\n' +
             '\tWritten by Dennis Nedry.\n',
    command: function(env, inputLine) {
      const arg = inputLine.split(/ +/)[1] || '';
      let output = '<span>system: must specify target system</span>';

      if (arg.length > 0) {
        let system = arg.replace(/s$/, '');
        system = system[0].toUpperCase() + system.slice(1);
        system = $('<div/>').text(system).html();
        output = '<div>' + system + ' containment enclosure....</div>' +
                 '<table id="system-output"><tbody>' +
                 '<tr><td>Security</td><td>[OK]</td></tr>' +
                 '<tr><td>Fence</td><td>[OK]</td></tr>' +
                 '<tr><td>Feeding Pavilion</td><td>[OK]</td></tr>' +
                 '</tbody></table>';

        $('#main-prompt').addClass('hide');
        $('#main-input').append($(output));
        output = '<div>System Halt!</div>';
        env.sounds.beep.play();

        setTimeout(function() {
          const wrap = $('.inner-wrap', env.active);
          env.sounds.beep.play();
          $('#main-input').append($(output));
          wrap.scrollTop(wrap[0].scrollHeight);
          $('#main-prompt').removeClass('hide');
        }, 900);
      } else {
        $('#main-input').append($(output));
      }
    }
  });

  jpTerminal.addCommand({
    name: 'ls',
    summary: 'list files in the current directory',
    manPage: 'SYNOPSIS\n' + 
             '\tls [FILE] ...\n\n' +
             'DESCRIPTION\n' + 
             '\tList information about the FILEs ' +
             '(the current directory by default).\n\n' +
             'AUTHOR\n' +
             '\tWritten by Richard Stallman and David MacKenzie.\n',
    command: function(env, inputLine) {
      $('#main-input').append($('<div>zebraGirl.jpg</div>'));
    }
  });

  jpTerminal.addCommand({
    name: 'display',
    summary: 'display image files (hint: use ls to find a \'file\')',
    manPage: 'SYNOPSIS\n' +
             '\tdisplay file ...\n\n' +
             'DESCRIPTION\n' +
             '\tDisplay is a machine architecture independent image ' +
             'processing and display\n\tprogram. It can ' +
             '<strong>display</strong> an image on any workstation screen ' +
             'running an X server.\n\n' +
             'AUTHOR\n' +
             '\tJohn Cristy, ImageMagick Studio.\n',
      command: function(env, inputLine) {
        const args = inputLine.trim().split(' ');

        if (args.length < 2) {
          $('#main-input')
            .append($('<span>display: no file specified</span>'));
          return;
        }

        if (inputLine.match(/zebraGirl\.jpg/)) {
          setTimeout(function() {
            $('#zebra-girl').css('z-index', ++env.maxIndex);
            $('#zebra-girl').show();
            blurAllWindows();
          }, 300);
        }
      }
  });

  jpTerminal.addCommand({
    name: 'keychecks',
    summary: 'display system level command history',
    manPage: 'SYNOPSIS\n' +
             '\tkeychecks\n\n' +
             'DESCRIPTION\n' +
             '\tA system level command log used for accountability ' +
             'purposes. keychecks must be\n\tactivated or deactivated ' +
             'via the main board.\n',
    command: function(env, inputLine) {
      const output =
        '13,42,121,32,88,77,19,13,44,52,77,90,13,99,13,100,13,109,55,103,144,' +
        '13,99,87,60,13,44,12,09,13,43,63,13,46,57,89,103,122,13,44,52,88,931,' +
        '13,21,13,57,98,100,102,103,13,112,13,146,13,13,13,77,67,88,23,13,13\n' +
        'system\n' +
        'nedry\n' +
        'go to command level\n' +
        'nedry\n' +
        '040/#xy/67&\n' +
        'mr goodbytes\n' +
        'security\n' +
        'keycheck off\n' +
        'safety off\n' +
        'sl off\n' +
        'security\n' +
        'whte_rbt.obj\n';
      $('#main-input').append(output);
    }
  });


  jpTerminal.addCommand({
    name: 'status',
    summary: 'show the live Jurassic Park operations board',
    manPage: `SYNOPSIS\n\tstatus\n\nDESCRIPTION\n\tDisplay fences, phones, tour vehicles, locks, lysine contingency, and sector alarms.\n`,
    command: function(env) {
      const park = env.park;
      const rows = [
        ['Electric fences', park.fencesOnline ? 'ONLINE' : 'OFFLINE'],
        ['Door locks', park.doorsLocked ? 'LOCKED' : 'UNLOCKED'],
        ['Phones', park.phonesOnline ? 'ONLINE' : 'DOWN'],
        ['Tour program', park.tourRunning ? 'RUNNING' : 'STOPPED'],
        ['Lysine contingency', park.lysineContingency ? 'ACTIVE' : 'STANDBY'],
      ];
      const table = $('<table id="ops-output"><tbody></tbody></table>');
      rows.forEach(function(row) {
        table.find('tbody').append($('<tr>').append($('<td>').text(row[0])).append($('<td>').text('[' + row[1] + ']')));
      });
      appendMain($('<div>').append($('<div>').text('Park Operations Status')).append(table));
    }
  });

  jpTerminal.addCommand({
    name: 'fences',
    summary: 'switch or inspect the park electric fences',
    manPage: `SYNOPSIS\n\tfences [on|off]\n\nDESCRIPTION\n\tInspect or change electric fence power. Turning fences off will trip paddock alarms.\n`,
    command: function(env, inputLine) {
      const arg = inputLine.trim().split(/ +/)[1] || '';
      if (!arg) {
        appendMain($('<div>').text('fences: ' + (env.park.fencesOnline ? 'ONLINE' : 'OFFLINE')));
        return;
      }
      if (!arg.match(/^(?:on|off)$/i)) {
        appendMain($('<div>').text('fences: expected on or off'));
        return;
      }
      env.park.fencesOnline = arg.toLowerCase() === 'on';
      setSectorStatus(env, 'trex', env.park.fencesOnline ? 'SECURE' : 'OFFLINE', env.park.fencesOnline ? '10,000 volt fence armed' : 'fence power lost; asset movement possible');
      setSectorStatus(env, 'raptor', env.park.fencesOnline ? 'CAUTION' : 'OFFLINE', env.park.fencesOnline ? 'motion sensors report perimeter pacing' : 'raptor pen restraint grid offline');
      env.sounds.beep.play();
      appendMain($('<div>').text('fences: ' + (env.park.fencesOnline ? 'power restored' : 'power disabled')));
    }
  });

  jpTerminal.addCommand({
    name: 'doors',
    summary: 'lock or unlock visitor center security doors',
    manPage: `SYNOPSIS\n\tdoors [lock|unlock]\n\nDESCRIPTION\n\tControl the visitor center door locks.\n`,
    command: function(env, inputLine) {
      const arg = inputLine.trim().split(/ +/)[1] || '';
      if (!arg.match(/^(?:lock|unlock)$/i)) {
        appendMain($('<div>').text('doors: ' + (env.park.doorsLocked ? 'LOCKED' : 'UNLOCKED') + ' (use lock or unlock)'));
        return;
      }
      env.park.doorsLocked = arg.toLowerCase() === 'lock';
      setSectorStatus(env, 'visitor', env.park.doorsLocked ? 'SECURE' : 'CAUTION', env.park.doorsLocked ? 'main rotunda and lab access nominal' : 'visitor center doors are unlocked');
      appendMain($('<div>').text('doors: visitor center ' + (env.park.doorsLocked ? 'locked' : 'unlocked')));
    }
  });

  jpTerminal.addCommand({
    name: 'reboot',
    summary: 'restore phone, tour, door, and fence subsystems',
    manPage: `SYNOPSIS\n\treboot\n\nDESCRIPTION\n\tRun the control room reboot sequence and restore park subsystems.\n`,
    command: function(env) {
      env.park.doorsLocked = true;
      env.park.fencesOnline = true;
      env.park.phonesOnline = true;
      env.park.tourRunning = true;
      env.park.lysineContingency = false;
      setSectorStatus(env, 'visitor', 'SECURE', 'main rotunda and lab access nominal');
      setSectorStatus(env, 'raptor', 'CAUTION', 'motion sensors report perimeter pacing');
      setSectorStatus(env, 'trex', 'SECURE', '10,000 volt fence armed');
      setSectorStatus(env, 'dock', 'SECURE', 'storm beacon and winch available');
      appendMain($('<div>').text('reboot: system ready. We spared no expense.'));
    }
  });


  jpTerminal.addCommand({
    name: 'phones',
    summary: 'switch or inspect island phone lines',
    manPage: `SYNOPSIS
	phones [on|off]

DESCRIPTION
	Inspect or change island phone service for the control room and visitor center.
`,
    command: function(env, inputLine) {
      const arg = inputLine.trim().split(/ +/)[1] || '';
      if (!arg.match(/^(?:on|off)$/i)) {
        appendMain($('<div>').text('phones: ' + (env.park.phonesOnline ? 'ONLINE' : 'DOWN') + ' (use on or off)'));
        return;
      }
      env.park.phonesOnline = arg.toLowerCase() === 'on';
      setSectorStatus(env, 'control', env.park.phonesOnline ? 'SECURE' : 'CAUTION', env.park.phonesOnline ? 'Unix mainframe awaiting commands' : 'phone lines are down; radio fallback required');
      appendMain($('<div>').text('phones: ' + (env.park.phonesOnline ? 'service restored' : 'service interrupted')));
    }
  });

  jpTerminal.addCommand({
    name: 'tour',
    summary: 'start, stop, or inspect the automated tour program',
    manPage: `SYNOPSIS
	tour [start|stop]

DESCRIPTION
	Control the automated Explorer tour program.
`,
    command: function(env, inputLine) {
      const arg = inputLine.trim().split(/ +/)[1] || '';
      if (!arg.match(/^(?:start|stop)$/i)) {
        appendMain($('<div>').text('tour: ' + (env.park.tourRunning ? 'RUNNING' : 'STOPPED') + ' (use start or stop)'));
        return;
      }
      env.park.tourRunning = arg.toLowerCase() === 'start';
      setSectorStatus(env, 'trex', env.park.tourRunning ? 'SECURE' : 'CAUTION', env.park.tourRunning ? '10,000 volt fence armed' : 'Explorer vehicles stopped near paddock overlook');
      appendMain($('<div>').text('tour program: ' + (env.park.tourRunning ? 'started' : 'stopped')));
    }
  });

  jpTerminal.addCommand({
    name: 'lysine',
    summary: 'toggle the book-inspired lysine contingency',
    manPage: `SYNOPSIS\n\tlysine [on|off]\n\nDESCRIPTION\n\tToggle the lysine contingency monitor referenced by the Jurassic Park novel.\n`,
    command: function(env, inputLine) {
      const arg = inputLine.trim().split(/ +/)[1] || '';
      if (!arg.match(/^(?:on|off)$/i)) {
        appendMain($('<div>').text('lysine: ' + (env.park.lysineContingency ? 'ACTIVE' : 'STANDBY') + ' (use on or off)'));
        return;
      }
      env.park.lysineContingency = arg.toLowerCase() === 'on';
      updateParkDisplay(env);
      appendMain($('<div>').text('lysine contingency ' + (env.park.lysineContingency ? 'armed' : 'returned to standby')));
    }
  });

  jpTerminal.addCommand({
    name: 'man',
    summary: 'display reference manual for a given command',
    manPage: 'SYNOPSIS\n' +
             '\tman title ...\n\n' +
             'DESCRIPTION\n' +
             '\tman locates and prints the titled entries from the on-line ' +
             'reference manuals.\n',
    command: function(env, inputLine) {
      const arg = inputLine.trim().split(/ +/)[1] || '';
      let output = 'What manual page do you want?';

      if (env.commands.hasOwnProperty(arg)) {
        output = env.commands[arg].manPage;
      } else if (arg) {
        output = 'No manual entry for ' + $('<div/>').text(arg).html();
      }

      $('#main-input').append(output);
    }
  });

  jpTerminal.addCommand({
    name: 'help', 
    summary: 'list available commands',
    manPage: 'SYNOPSIS\n' +
              '\thelp\n\n' +
              'DESCRIPTION\n' +
              '\tDisplay a command summary for Jurassic Systems.\n\n' +
              'AUTHOR\n' +
              '\tWritten by <a href="https://tully.io">Tully Robinson</a>.\n',
    command: function(env, inputLine) {
      for (var command in env.commands) {
        env.active.find('.command-history')
          .append($('<div>')
          .text(
            env.commands[command].name + 
            ' - ' +
            env.commands[command].summary)
          );
      }
    }
  });

  // helpers
  const flicker = function(altId, interval, duration) {
    let visible = true;
    const alt = $('#' + altId).show();
    const flickering = setInterval(function() {
      if (visible) {
        alt.css('opacity', '1');
      } else {
        alt.css('opacity', '0');
      }

      visible = !visible;
    }, interval);

    setTimeout(function() {
      clearInterval(flickering);
      alt.css('opacity', '0');
      alt.hide()
    }, duration);
  };

  const blurAllWindows = function() {
    $('.cursor', '.irix-window').removeClass('active-cursor');
    $('.buffer').blur();
  };

  const scaleEnvironment = function() {
    const env = $('#environment');
    const container = $('#scale-container');
    const baseW = env.data('base-width') || env.outerWidth();
    const baseH = env.data('base-height') || env.outerHeight();
    env.data('base-width', baseW);
    env.data('base-height', baseH);
    const scale = Math.min(container.width() / baseW, container.height() / baseH);
    env.css('transform', 'scale(' + scale + ')');
  };

  $(document).ready(function() {
    scaleEnvironment();
    $(window).on('resize', scaleEnvironment);
    // attempt to cache objects
    $(['theKingBlur.jpg',
      'theKingFocus.jpg',
      'macHDBlur.jpg',
      'asciiNewman.jpg',
      'zebraGirlWindow.jpg',
    ]).each(function() {
      new Image().src = 'img/' + this;
    });


    // remove boot screen
    setTimeout(function() {
      $('#irix-boot').remove();
      $('#main-buffer').focus();

      if (!location.pathname.match(/system/)) {
        $('#main-buffer').blur();
        $('#intro').show();
        $('#intro').click(function() {
          $(this).fadeOut(1000);
          $('#intro-scene').attr('src', '');
        });
      }
    }, 4500);

    $('body').click(blurAllWindows);

    (function() {
      let diffX = 0;
      let diffY = 0;

      $('.window-bar').mousedown(function(e) {
        var dragging = $(this).parent()
        .css('z-index', jpTerminal.nextIndex())
        .addClass('dragging');
      diffY = e.pageY - dragging.offset().top;
      diffX = e.pageX - dragging.offset().left;
      });

      $('body').mousemove(function(e) {
        $('.dragging').offset({
          top: e.pageY - diffY,
          left: e.pageX - diffX
        });
      });
    }());

    $('body').mouseup(function(e) {
      $('.dragging').removeClass('dragging');
    });

    $('.irix-window').click(function(e) {
      e.stopPropagation();
      blurAllWindows();
      jpTerminal.setActive(this);
      $('.buffer', this).focus();
      $(this).css('z-index', jpTerminal.nextIndex());
      $(this).find('.cursor').addClass('active-cursor');
    });

    $(window).keydown(function(e) {
      if ([37, 38, 39, 40].indexOf(e.keyCode || e.which) > -1) {
        e.preventDefault();
      }
    });

    $('.irix-window').keydown(function(e) {
      const key = e.keyCode || e.which;
      const activeTerminal = jpTerminal.getActive();

      if (!activeTerminal) {
        return false;
      }

      // if enter
      if (key === 13) {
        const line = activeTerminal.find('.buffer').val();
        activeTerminal.find('.buffer').val('');

        if (activeTerminal.attr('id') === 'chess-terminal') {
          $('#curr-chess-input').html('');
          activeTerminal.find('.command-history')
            .append($('<div class="entered-command">')
            .text(line || ' '));
        } else {
          $('#curr-main-input').html('');
          jpTerminal.buildCommandLine(line);
        }
      }

      const wrap = activeTerminal.find('.inner-wrap');
      wrap.scrollTop(wrap[0].scrollHeight);
    });

    $('#main-terminal .buffer').bind('input propertychange', function() {
      $('#curr-main-input').text($(this).val());
    });

    $('#chess-terminal .buffer').bind('input propertychange', function() {
      $('#curr-chess-input').text($(this).val());
    });

    $('.sector').click(function(e) {
      e.stopPropagation();
      const activeEnv = jpTerminal.getEnvironment();
      activeEnv.park.selectedSector = $(this).data('sector');
      updateParkDisplay(activeEnv);
    });

    updateParkDisplay(jpTerminal.getEnvironment());

    $('#apple-desktop').click(function(e){
      if ($(e.target).closest('.mac-window').attr('id') !== 'the-king-window') {
        flicker('the-king-blur', 50, 450);
      }
    });
  });
}(jQuery, soundManager));
