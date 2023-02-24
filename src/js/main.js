//Import needed functions from firebase
import { initializeApp } from 'firebase/app'
import { getFirestore, doc, setDoc, updateDoc  } from "firebase/firestore"
import { getAuth, signInAnonymously } from "firebase/auth"

//Import jquery, bootstrap, etc.
import * as $ from 'jquery'
import videojs from 'video.js'
import Sortable from 'sortablejs'
import * as bootstrap from 'bootstrap'

//Import stylesheets
import 'bootstrap/dist/css/bootstrap.min.css'
import 'video.js/dist/video-js.css'
import '../css/style.css'


//Firebase config to connect to online database
const firebaseConfig = {

  apiKey: "AIzaSyBAnN60-yIbaJjKoQg1nDFebm2fGgGncgA",

  authDomain: "nlp-dynamic-impressions.firebaseapp.com",

  projectId: "nlp-dynamic-impressions",

  storageBucket: "nlp-dynamic-impressions.appspot.com",

  messagingSenderId: "914057375130",

  appId: "1:914057375130:web:6d8b8a8abd36f4c8fd1e23",

  measurementId: "G-YF915CTCP4"

}

//Initialize firebase functions
const app = initializeApp(firebaseConfig)

const auth = getAuth(app)
const db = getFirestore(app)


//Sign in anonymously to firebase
signInAnonymously(auth)
  .then(() => {
    // Signed in..
  })
  .catch((error) => {
    const errorCode = error.code
    const errorMessage = error.message
    // ...
  })


//Hide all elements that will be shown later
$("#reject").hide()
$("#instructions1").hide()
$("#instructions2").hide()
$("#video-section").hide()
$("#sorting-body").hide()
$("#final-impression-body").hide()
$("#finished").hide()
$("#pause_notice").hide()
$("#too_early_notice").hide()
$("#cannot_unpause_notice").hide()
$("#cannot_add_notice").hide()
$("#final_cannot_add_notice").hide()


var subj_id = null
  

//Video list, currently must be manually updated
const videos = ["sample_audition_tape.mp4","usc_comedic_monologue.mp4","yale_school_drama.mp4"]

var current_vid = 0

$("#video_source").attr('src', "video/" + videos[current_vid])
console.log($("#video_source").attr("src"))

//Declare videojs object with current video as source
var mainVideo = videojs('main_video')
mainVideo.src({ type: 'video/mp4', src: "video/" + videos[current_vid] })
mainVideo.pause()
var videoMode = false
var recentTime = -2

//Declare lists of words, etc.
var descriptors = []
var current_terms = []
var emotions = null, traits = null, mental_states = null, identity = null, final = null


//Function to attach an event listener to the delete button on each word when it is submitted.
function attach_delete_listener(input) {
    input = input.replaceAll(' ', '_')
    $("#" + input + "_delete").on("click", function() {
        console.log('delete: ' + input)
        current_terms.splice(current_terms.indexOf(input.replaceAll('_', ' ')), 1)
        $("#" + input).remove()
        console.log(current_terms)
        if (current_terms.length == 0) {
            $("#descript_submit").attr('disabled','disabled')
            $("#final_submit").attr('disabled','disabled')
        }
    })
}


//Categorize each word based on the sorted lists that the subject makes on the sorting page.
function categorizeDescriptors(descriptor_array, category, categoryName) {
    category = category.toArray()
    console.log(category)
    console.log(descriptor_array)
    for (const i in descriptor_array) {
        if (category.includes(descriptor_array[i].name.replaceAll(' ','_'))){
            descriptor_array[i].category = categoryName
        }
    }
    return descriptor_array
}

//Submit participant form, reject them if they cannot speak English
$("#info-form").on("submit", function(event) {
    event.preventDefault()
    if ($("#english_check_input").val() == "No") {
        $("#reject").show()
        $("#screener").hide()
    }

    else {
        subj_id = {
            subj_id:$("#prolific_id").val()
        }
        $("#screener").hide()
        $("#instructions1").show()
        $("#welcome").hide()
        //Submit subj_id to firebase
        try {
            setDoc(doc(db, "studies/trial_study_1/participants", subj_id.subj_id), {
              "subj_id":subj_id["subj_id"]
            })
            console.log("Document written with ID: " + subj_id.subj_id)
          } catch (e) {
            console.error("Error adding document: ", e)
          }
    }
})

//Show next instructions
$("#next_instruct").on("click", function () {
    $("#instructions1").hide()
    $("#instructions2").show()
})


//Begin task, load video and set options for interaction
$("#start_task").on("click", function () {

    $("#instructions2").hide()
    $("#video-section").show()

    mainVideo.src({ type: 'video/mp4', src: "video/" + videos[current_vid] })
    mainVideo.controlBar.progressControl.disable()
    mainVideo.controlBar.playToggle.enable()
    mainVideo.options({
        userActions: {
            click: true
        }
    })

    videoMode = true
    mainVideo.play()
    
})

//Add word to word list
$("#add_descript_form").on( "submit", function(event) {
    event.preventDefault()
    var input = $('#descript_input').val()
    input = input.replaceAll(' ', '_')

    console.log("submitted")

    //Validate input and reject if duplicate or if no input provided
    if (current_terms.includes(input.replaceAll('_', ' '))) {
        $("#cannot_add_notice").show()
    }
    else if (input=="") {
        console.log("Error: no input provided")
    } 
    else {
        current_terms.push(input.replaceAll('_',' '))

        $('#desc_sorter').append('<div class="justify-content-center"><li class="list-group-item" id=' + input + '> ' + input.replaceAll('_', ' ') + '<button class="item_delete" type="button" id="' + input + '_delete">✖</button></li></div>')

        attach_delete_listener(input)
        console.log(current_terms)
        $("#descript_submit").removeAttr('disabled')
        $("#cannot_add_notice").hide()
        $('#descript_input').val("")
    }

})

//Submit list of words
$("#descript_submit").on("click", function () {
    recentTime = mainVideo.currentTime()

    //Define current list of descriptors, push to overall descriptor array
    let current_descriptors = []
    for (const i in current_terms) {
        let descriptor = {
            name:current_terms[i],
            timestamp:mainVideo.currentTime(),
            category:null
        }
        current_descriptors.push(descriptor)
    }
    descriptors.push.apply(descriptors, current_descriptors)
    console.log(descriptors)

    $("#desc_sorter").empty()

    current_terms = []
    current_descriptors = []

    //Re-enable manual pausing, etc.
    mainVideo.controlBar.playToggle.enable()
    mainVideo.options({
        userActions: {
            click: true
        }
    })

    $("#cannot_unpause_notice").hide()

    mainVideo.play()
})



//Pause video event, prevent if done too quickly
//Otherwise, block resuming until they submit list
mainVideo.on("pause", function () {
    if (mainVideo.currentTime() - recentTime <= 2) {
        mainVideo.play()
        $("#too_early_notice").show()
    }
    else {
        $("#descript_add").removeAttr('disabled')
        $("#descript_input").removeAttr('disabled')
        $("#pause_notice").hide()
        $("#too_early_notice").hide()
        $("#cannot_unpause_notice").show()
        mainVideo.controlBar.playToggle.disable()
        mainVideo.options({
            userActions: {
                click: false
            }
        })
    }
})

//Disable word submitting functions while video is playing
mainVideo.on("play", function () {
    $("#descript_submit").attr('disabled', 'disabled')
    $("#descript_add").attr('disabled', 'disabled')
    $("#descript_input").attr('disabled', 'disabled')
    $("#pause_notice").show()

    //Sometimes video somehow keeps playing when not on the video screen, so this pauses it if that's the case. 
    if (!videoMode) {
        mainVideo.pause()
    }
})

//Video ending function
mainVideo.on('ended', function () {
    $("#experiment-body").hide()

    //Skip sorting page if participant submitted zero words
    if (Object.keys(descriptors).length == 0) {
        current_terms = []
        $("#final_submit").attr('disabled','disabled')
        $('#final-impression-body').show()
    }

    //Otherwise, show sorting screen
    else {
        $('#sorting-body').show()
        $("#sorting_submit").attr('disabled','disabled')

        mainVideo.pause()
        videoMode = false
        let current_descriptors = []

        for (const descriptor of descriptors) {
            if (!(current_descriptors.includes(descriptor.name))) {
                current_descriptors.push(descriptor.name)
            }
        }
        for (const descriptor of current_descriptors) {
            $('#main_sorter').append('<li class="list-group-item" id=' + descriptor.replaceAll(' ','_') + '> ' + descriptor + '</li>')
        }

        //Initialize SortableJS sortables
        let main = Sortable.create(main_sorter, {
            animation: 100,
            group: 'shared',
            draggable: '.list-group-item',
            dataIdAttr: 'id',
            onEnd: function(evt) {
                console.log("Moved")
                console.log(this.toArray())
                if (this.toArray().length==0) {
                    console.log("Allow submit")
                    $("#sorting_submit").removeAttr('disabled')
                }
                else {
                    console.log("Forbid submit")
                    $("#sorting_submit").attr('disabled','disabled')
                }
            },
            onAdd: function (evt) {
                console.log("Forbid submit")
                    $("#sorting_submit").attr('disabled','disabled')
            }
        })

        emotions = Sortable.create(emotion_sorter, {
            animation: 100,
            group: 'shared',
            draggable: '.list-group-item',
            dataIdAttr: 'id'
        })

        traits = Sortable.create(trait_sorter, {
            animation: 100,
            group: 'shared',
            draggable: '.list-group-item',
            dataIdAttr: 'id'
        })

        mental_states = Sortable.create(mental_state_sorter, {
            animation: 100,
            group: 'shared',
            draggable: '.list-group-item',
            dataIdAttr: 'id'
        })

        identity = Sortable.create(identity_sorter, {
            animation: 100,
            group: 'shared',
            draggable: '.list-group-item',
            dataIdAttr: 'id'
        })
    }
})

//Submit sorting page
$("#sorting_submit").on("click", function () {
    $("#sorting-body").hide()
    $('#final-impression-body').show()

    let categorized_descriptors = descriptors

    //Categorize words for each category
    categorized_descriptors = categorizeDescriptors(categorized_descriptors, emotions, "emotion")
    categorized_descriptors = categorizeDescriptors(categorized_descriptors, traits, "trait")
    categorized_descriptors = categorizeDescriptors(categorized_descriptors, mental_states, "mental_state")
    categorized_descriptors = categorizeDescriptors(categorized_descriptors, identity, "identity")

    //Prepare firebase submission
    let submission = {
        ...subj_id,
        data:{
            "categorized_descriptors":categorized_descriptors
        },
        video:videos[current_vid]
    }

    //Submit to firebase
    try {
        const docRef = setDoc(doc(db, "studies/trial_study_1/participants/" + submission.subj_id + "/video_responses", submission.video), submission.data)
        console.log("Document written with ID: ", docRef.id)
      } catch (e) {
        console.error("Error adding document: ", e)
    }

    //Prepare final impression page
    current_terms = []
    let current_descriptors = []

    for (const descriptor of descriptors) {
        if (!(current_descriptors.includes(descriptor.name))) {
            current_descriptors.push(descriptor.name)
        }
    }
    for (const descriptor of current_descriptors) {
        $('#final_sorter').append('<div class="justify-content-center"><li class="list-group-item" id=' + descriptor.replaceAll(' ', '_') + '> ' + descriptor + '<button class="item_delete" type="button" id="' + descriptor.replaceAll(' ','_') + '_delete">✖</button></li></div>')
        current_terms.push(descriptor)
        attach_delete_listener(descriptor)
    }

    console.log(current_terms)
    if(current_terms.length>0) {
        $("#final_submit").removeAttr('disabled')
    }

    $("#mental_state_sorter").empty()
    $("#emotion_sorter").empty()
    $("#trait_sorter").empty()
    $("#identity_sorter").empty()

    // final = Sortable.create(final_sorter, {
    //     animation: 100,
    //     draggable: '.list-group-item',
    //     dataIdAttr: 'id'
    // })
})

//Event when new words are added on final impressions page
$("#final_descript_form").on( "submit", function(event) {
    event.preventDefault()
    let input = $('#final_descript_input').val()
    input = input.replaceAll(' ', '_')

    console.log("submitted")
    
    if (current_terms.includes(input.replaceAll('_', ' '))) {
        $("#final_cannot_add_notice").show()
    }
    else if (input=="") {
        console.log("Error: no input provided")
    }
    else {
        current_terms.push(input.replaceAll('_',' '))

        $('#final_sorter').append('<div class="justify-content-center"><li class="list-group-item" id=' + input + '> ' + input.replaceAll('_',' ') + '<button class="item_delete" type="button" id="' + input + '_delete">✖</button></li></div>')

        attach_delete_listener(input)
        console.log(current_terms)

        $("#final_submit").removeAttr('disabled')
        $("#final_cannot_add_notice").hide()
        $('#final_descript_input').val("")
    }

})

//Final impressions submit
$("#final_submit").on("click", function () {
    descriptors = []
    let current_descriptors = []
    for (const i in current_terms) {
        let descriptor = {
            name:current_terms[i]
        }
        current_descriptors.push(descriptor)
    }
    descriptors.push.apply(descriptors, current_descriptors)

    //Prepare firebase submission
    let submission = {
        ...subj_id,
        data:{
            final_descriptors:descriptors
        },
        video:videos[current_vid]
    }
    //Submit to firebase
    try {
        const docRef = updateDoc(doc(db, "studies/trial_study_1/participants/" + submission.subj_id + "/video_responses", submission.video), submission.data)
        console.log("Document written with ID: ", docRef.id)
      } catch (e) {
        console.error("Error adding document: ", e)
    }

    current_vid++

    //Load next video if there are more
    if (current_vid < videos.length) {

        descriptors = []
        current_terms = []
        emotions = traits = mental_states = identity = final = null

        recentTime = -2
        mainVideo.src({ type: 'video/mp4', src: 'video/' + videos[current_vid] })
        mainVideo = videojs('main_video')
        mainVideo.controlBar.progressControl.disable()
        mainVideo.controlBar.playToggle.enable()
        mainVideo.options({
            userActions: {
                click: true
            }
        })
        videoMode = true

        $("#pause_notice").hide()
        $("#too_early_notice").hide()
        $("#cannot_unpause_notice").hide()
        $("#cannot_add_notice").hide()
        $('#sorting-body').hide()
        $('#final-impression-body').hide()
        $("#final_cannot_add_notice").hide()
        $("#experiment-body").show()
        $("#final_sorter").empty()
        $("#mental_state_sorter").empty()
        $("#emotion_sorter").empty()
        $("#trait_sorter").empty()
        $("#identity_sorter").empty()

        mainVideo.play()
    }
    
    //Otherwise, load study finished page
    else {
        $("#instructions2").hide()
        $("#video-section").hide()
        $("#sorting-body").hide()
        $('#final-impression-body').hide()
        $("#finished").show()
    }
})


//Hide window until all JS is finished loading
$(window).on('load', function() {
    $("#cover").hide();
 });