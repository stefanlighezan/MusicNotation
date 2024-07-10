document.addEventListener('DOMContentLoaded', () => {
    const VF = Vex.Flow;
    const scoreContainer = document.getElementById('score-container');
    const exportButton = document.getElementById('export-musicxml');

    let selectedStaff = null;
    let accidental = null;

    const parts = JSON.parse(localStorage.getItem('parts'));

    if (parts) {
        parts.forEach(part => {
            const staffContainer = document.createElement('div');
            staffContainer.className = 'staff-container';

            const partName = document.createElement('button'); // Changed to button for selection
            partName.className = 'part-name';
            partName.innerText = part;
            partName.addEventListener('click', () => {
                selectPart(partName, part);
            });

            const staff = document.createElement('div');
            staff.className = 'staff';

            staffContainer.appendChild(partName);
            staffContainer.appendChild(staff);
            scoreContainer.appendChild(staffContainer);

            // Create a VexFlow renderer
            const renderer = new VF.Renderer(staff, VF.Renderer.Backends.SVG);
            renderer.resize(500, 120);
            const context = renderer.getContext();
            context.setFont("Arial", 10, "").setBackgroundFillStyle("#eed");

            // Create a stave of width 400 at position x=0, y=40 on the SVG.
            const stave = new VF.Stave(0, 40, 400);

            // Add a clef and time signature.
            stave.addClef("treble").addTimeSignature("4/4");

            // Connect it to the rendering context and draw!
            stave.setContext(context).draw();
        });
    }

    document.addEventListener('keydown', (event) => {
        if (!selectedStaff) return;

        const noteKey = event.key.toUpperCase();

        if (['A', 'B', 'C', 'D', 'E', 'F', 'G'].includes(noteKey)) {
            const rect = selectedStaff.getBoundingClientRect();
            const x = event.clientX - rect.left; // X position relative to selected staff
            placeNoteOnStaff(selectedStaff, x, noteKey, accidental);
            accidental = null; // Reset accidental after placing the note
        } else if (noteKey === '+' || noteKey === '#') {
            accidental = '#';
        } else if (noteKey === '-') {
            accidental = 'b';
        }
    });

    exportButton.addEventListener('click', exportToMusicXML);

    function selectPart(button, partName) {
        const staffContainers = document.querySelectorAll('.staff-container');
        staffContainers.forEach(container => {
            const nameButton = container.querySelector('.part-name');
            if (nameButton === button) {
                selectedStaff = container.querySelector('.staff');
                nameButton.classList.add('selected');
            } else {
                nameButton.classList.remove('selected');
            }
        });
    }

    function placeNoteOnStaff(staff, x, key, accidental) {
        const rect = staff.getBoundingClientRect();
        const noteKey = key.toLowerCase() + '/4'; // Default octave
        const note = new VF.StaveNote({
            clef: 'treble',
            keys: [noteKey],
            duration: '8'
        });

        if (accidental) {
            note.addModifier(new VF.Accidental(accidental));
        }

        const voice = new VF.Voice({ num_beats: 4, beat_value: 4 });
        const formatter = new VF.Formatter().joinVoices([voice]).format([voice], 400);

        let measureNotes = getMeasureNotes(staff);
        let totalDuration = calculateTotalDuration(measureNotes);

        // Check if there's enough space for the new note
        if (totalDuration + 0.5 > 4) {
            return; // Exit if adding this note exceeds the measure's capacity
        }

        voice.addTickables([note]);

        // Calculate remaining duration needed to fill the measure
        const remainingDuration = 4 - totalDuration - 0.5;

        if (remainingDuration > 0) {
            const restNote = new VF.StaveNote({
                keys: ["b/4"],
                duration: remainingDuration.toString()
            });
            voice.addTickable(restNote);
        }

        voice.draw(staff.getContext(), staff);
    }

    function getMeasureNotes(staff) {
        const notes = staff.querySelectorAll('.vf-note');
        return notes;
    }

    function calculateTotalDuration(notes) {
        let totalDuration = 0;
        notes.forEach(n => {
            totalDuration += parseFloat(n.getAttribute('data-duration'));
        });
        return totalDuration;
    }

    function exportToMusicXML() {
        let musicXML = '<?xml version="1.0" encoding="UTF-8"?>\n';
        musicXML += '<score-partwise version="3.1">\n';

        parts.forEach((part, index) => {
            musicXML += `<part id="P${index + 1}">\n`;
            musicXML += `<measure number="1">\n`;
            const notes = selectedStaff.querySelectorAll('.vf-note');
            let totalDuration = 0;
            notes.forEach(n => {
                const duration = parseFloat(n.getAttribute('data-duration'));
                totalDuration += duration;
                musicXML += `<note>\n<pitch>\n<step>${n.getAttribute('data-pitch')}</step>\n`;
                if (n.getAttribute('data-accidental')) {
                    musicXML += `<alter>${n.getAttribute('data-accidental')}</alter>\n`;
                }
                musicXML += `<octave>${n.getAttribute('data-octave')}</octave>\n</pitch>\n`;
                musicXML += `<duration>${duration}</duration>\n`;
                musicXML += `</note>\n`;
            });

            if (totalDuration < 4) {
                const restDuration = 4 - totalDuration;
                musicXML += `<note>\n<rest/>\n<duration>${restDuration}</duration>\n</note>\n`;
            }

            musicXML += `</measure>\n`;
            musicXML += `</part>\n`;
        });

        musicXML += '</score-partwise>';
        console.log(musicXML);
    }
});
