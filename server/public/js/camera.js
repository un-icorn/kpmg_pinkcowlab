var camSelection = document.getElementById("selectArea");
//Global variables
var video = document.getElementById("vid"); //where we will put & test our video output
var deviceList = document.getElementById("devices"); //device list dropdown
var devices = []; //getSources object to hold various camera options
var stream;
var selectedCamera = []; //used to hold a camera's ID and other parameters
var tests; //holder for our test results
var r = 0; //used for iterating through the array
var camNum = 0; //used for iterating through number of camera
var scanning = false; //variable to show if we are in the middle of a scan
var height = 0;
var width = 0;
var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

function gotDevices(deviceInfos) {
  camSelection.hidden = false;
  let camcount = 1; //used for labeling if the device label is not enumerated
  for (let i = 0; i !== deviceInfos.length; ++i) {
    let deviceInfo = deviceInfos[i];
    let option = document.createElement("option");
    option.value = deviceInfo.deviceId;
    if (deviceInfo.kind === "videoinput") {
      option.text = deviceInfo.label || "camera " + camcount;
      devices.push(option);
      deviceList.add(option);
      camcount++;
    }
  }
  console.log(deviceList);
}

function errorCallback(error) {
  console.log("navigator.getUserMedia error: ", error);
}

navigator.mediaDevices
  .getUserMedia({ audio: false, video: true })
  .then((mediaStream) => {
    window.stream = mediaStream; // make globally available
    video.srcObject = mediaStream;

    //Now enumerate devices
    navigator.mediaDevices
      .enumerateDevices()
      .then(gotDevices)
      .then(
        (video.onloadedmetadata = function (e) {
          video.play();
        })
      )
      .catch(errorCallback);
  })
  .catch((error) => {
    console.error("getUserMedia error!", error);
  });

if (document.location.hostname !== "localhost") {
  //check if the user is using http vs. https & redirect to https if needed
  if (document.location.protocol !== "https:") {
    $(document).html("This doesn't work well on http. Redirecting to https");
    console.log("redirecting to https");
    document.location.href =
      "https:" +
      document.location.href.substring(document.location.protocol.length);
  }
}

var scanButton = document.getElementById("cam-scan");

scanButton.onclick = () => {
  console.log("scan");
  document.getElementById("results").hidden = false;
  document.getElementById("jump").hidden = false;
  tests = quickScan;
  scanning = true;

  if (devices) {
    //run through the deviceList to see what is selected
    for (let deviceCount = 0, d = 0; d < deviceList.length; d++) {
      if (deviceList[d].selected) {
        //if it is selected, check the label against the getSources array to select the proper ID
        for (let z = 0; z < devices.length; z++) {
          if (devices[z].value === deviceList[d].value) {
            //just pass along the id and label
            let camera = {};
            camera.id = devices[z].value;
            camera.label = devices[z].text;
            selectedCamera[deviceCount] = camera;
            console.log(
              selectedCamera[deviceCount].label +
                "[" +
                selectedCamera[deviceCount].id +
                "] selected"
            );
            deviceCount++;
          }
        }
      }
    }

    //Make sure there is at least 1 camera selected before starting
    if (selectedCamera[0]) {
      gum(tests[r], selectedCamera[0]);
    } else {
      console.log("No camera selected. Defaulting to " + deviceList[0].text);
      //$('button').prop("disabled",false);

      selectedCamera[0] = {
        id: deviceList[0].value,
        label: deviceList[0].text,
      };
      gum(tests[r], selectedCamera[0]);
    }
  }
  //if no device enumeration don't pass a Camera ID
  else {
    selectedCamera[0] = { label: "Unknown" };
    gum(tests[r]);
  }
};

function gum(candidate, device) {
  console.log("trying " + candidate.label + " on " + device.label);

  //Kill any running streams;
  if (stream) {
    stream.getTracks().forEach((track) => {
      track.stop();
    });
  }

  //create constraints object
  let constraints = {
    audio: false,
    video: {
      deviceId: device.id ? { exact: device.id } : undefined,
      width: { exact: candidate.width }, //new syntax
      height: { exact: candidate.height }, //new syntax
    },
  };

  setTimeout(
    () => {
      navigator.mediaDevices
        .getUserMedia(constraints)
        .then(gotStream)

        .catch((error) => {
          console.log("getUserMedia error!", error);

          if (scanning) {
            captureResults("fail: " + error.name);
          }
        });
    },
    stream ? 200 : 0
  ); //official examples had this at 200

  function gotStream(mediaStream) {
    //change the video dimensions
    console.log(
      "Display size for " +
        candidate.label +
        ": " +
        candidate.width +
        "x" +
        candidate.height
    );
    video.width = candidate.width;
    video.height = candidate.height;
    canvas.width = candidate.width;
    canvas.height = candidate.height;
    height = candidate.height;
    width = candidate.width;

    scanning = false;

    // make globally available
    video.srcObject = mediaStream;

    console.log("draw");
  }
}

//Save results to the candidate so
function captureResults(status) {
  if (!scanning)
    //exit if scan is not active
    return;

  r++;

  //go to the next tests
  if (r < tests.length) {
    gum(tests[r], selectedCamera[camNum]);
  }
}

const quickScan = [
  {
    label: "360p(nHD)",
    width: 640,
    height: 360,
    ratio: "16:9",
  },
  {
    label: "CIF",
    width: 352,
    height: 288,
    ratio: "4:3",
  },
  {
    label: "QVGA",
    width: 320,
    height: 240,
    ratio: "4:3",
  },
  {
    label: "QCIF",
    width: 176,
    height: 144,
    ratio: "4:3",
  },
  {
    label: "QQVGA",
    width: 160,
    height: 120,
    ratio: "4:3",
  },
];
