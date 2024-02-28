import React, {useState, useEffect} from 'react';
import './App.css';
import logo from './charm.jpg';
import Dropdown from 'react-bootstrap/Dropdown';

// Constants for service and characteristic UUIDs
const SERVICE_UUID = "00002a6a-0000-1000-8000-00805f9b34fb";
const CHARACTERISTICS_UUID = {
  command: "00002a6b-0000-1000-8000-00805f9b34fb",
  // min_pressure: "00002a6c-0000-1000-8000-00805f9b34fb",
  // max_pressure: "00002a6d-0000-1000-8000-00805f9b34fb",
  // pressure: "00002a6e-0000-1000-8000-00805f9b34fb",
  battery: "00002a6f-0000-1000-8000-00805f9b34fb"
};
const initialActuators = Array.from({ length: 8 }, (_, i) => ({ id: i, label: `${i + 1}` }));


const App = () => {
  const [device, setDevice] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [characteristics, setCharacteristics] = useState({});
  const [actuatorNumbers, setActuatorNumbers] = useState(8); 
  const [placedActuators, setPlacedActuators] = useState([]);
  const [pressures, setPressures] = useState(Array(8).fill(''));
  const [grid, setGrid] = useState(Array.from({ length: 4}, () => Array(5).fill(null)));


  // Convert actionNumbers object from your p5.js sketch to an array for easy mapping
  const actionNumbers = [
    { name: "one", value: 1 },
    { name: "two", value: 2 },
    { name: "three", value: 3 },
    { name: "four", value: 4 },
    { name: "five", value: 5 },
    { name: "six", value: 6 },
    { name: "seven", value: 7 },
    { name: "eight", value: 8 },
  ];

  const allActuatorsPlaced = placedActuators.length >= actuatorNumbers; // checks if all actuators are placed.

  // Adjust actuators available for dragging based on dropdown selection
  const handleActuatorNumberChange = (number) => {
    if (actuatorNumbers != 8) {
      alert("You already have selected a set number of actuators. Click reset to reset the entire system.");
    } else {
      setActuatorNumbers(number);
      setPlacedActuators([]);
    }
  };

  // const handleDragStart = (event, actuator) => {
  //   console.log(event);
  //   event.dataTransfer.setData('text/plain', JSON.stringify(actuator));
  //   event.dataTransfer.effectAllowed = 'move';
  // };
  const handleDragStart = (event, actuator, source = 'basket', rowIndex = null, colIndex = null) => {
    const dragData = JSON.stringify({ actuator, source, rowIndex, colIndex });
    event.dataTransfer.setData('text/plain', dragData);
    event.dataTransfer.effectAllowed = 'move';
  };

  // const handleDrop = (event, rowIndex, colIndex) => {
  //   event.preventDefault();
  //   const actuator = JSON.parse(event.dataTransfer.getData('text'));
  
  //   if (!placedActuators.find(a => a.id === actuator.id)) {
  //     // Place the actuator
  //     // setPlacedActuators(prev => {
  //     //   const newPlaced = [...prev, actuator];
  //     //   // setActuatorNumbers(newPlaced.length); // Update the number of actuators based on the new array's length
  //     //   return newPlaced;
  //     // });
  //     setPlacedActuators(prev => [...prev, actuator]);

  //     // Update the grid with the dropped actuator
  //     const newGrid = [...grid];
  //     newGrid[rowIndex] = [...newGrid[rowIndex]]; // Make a copy of the row to ensure immutability
  //     newGrid[rowIndex][colIndex] = actuator;
  //     setGrid(newGrid);
  //   }
  //   // const charName = determineCharNameBasedOnActuatorOrPosition(actuator, rowIndex, colIndex);
  //   // const value = determineValueBasedOnActuator(actuator); // Define how the actuator determines the value
  //   // writeToCharacteristic(charName, value);
  // };
  const handleDrop = (event, dropRowIndex, dropColIndex) => {
    event.preventDefault();
    const { actuator, source, rowIndex: dragRowIndex, colIndex: dragColIndex } = JSON.parse(event.dataTransfer.getData('text'));
    
    if (source === 'grid' && dragRowIndex !== null && dragColIndex !== null) {
      // Handle rearranging within the grid
      const newGrid = [...grid];
      // Swap or move actuator
      const temp = newGrid[dropRowIndex][dropColIndex];
      newGrid[dropRowIndex][dropColIndex] = newGrid[dragRowIndex][dragColIndex];
      newGrid[dragRowIndex][dragColIndex] = temp;
      setGrid(newGrid);
    } else if (!placedActuators.find(a => a.id === actuator.id)) {
      // Handle dropping a new actuator into the grid
      setPlacedActuators(prev => [...prev, actuator]);
      const newGrid = [...grid];
      newGrid[dropRowIndex][dropColIndex] = actuator;
      setGrid(newGrid);
    }
  };
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const resetButtons = (e) => {
    setActuatorNumbers(8);
    setPlacedActuators([]);
    
  }

  const handleSubmit = (event) => {
    event.preventDefault();
    console.log('Submitted Pressures:', pressures.slice(0, actuatorNumbers));

    // SEND DATA TO ARDUINO
  };

  const connectToDevice = async () => {
    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [SERVICE_UUID, ...Object.values(CHARACTERISTICS_UUID)],
      });

      const server = await device.gatt.connect();
      setIsConnected(true);
      setDevice(device);

      // Getting service
      const service = await server.getPrimaryService(SERVICE_UUID);

      // Mapping characteristics
      const tempCharacteristics = {};
      for (const [key, uuid] of Object.entries(CHARACTERISTICS_UUID)) {
        tempCharacteristics[key] = await service.getCharacteristic(uuid);
      }
      setCharacteristics(tempCharacteristics);

      console.log('Connected to device:', device.name);
    } catch (error) {
      console.error('There was an error connecting to the device:', error);
    }
  };

  const disconnectToDevice = async () => {
    if (device && device.gatt.connected) {
      device.gatt.disconnect();
      setIsConnected(false); // Assuming you have a state setter for connection status
      console.log('Disconnected from the device:', device.name);
    } else {
      console.log('No device is connected or the device is already disconnected.');
    }
  };

  const writeToCharacteristic = async (charName, value) => {
    if (!characteristics[charName]) {
      console.log(`Characteristic ${charName} not found!`);
      return;
    }
    try {
      await characteristics[charName].writeValue(new Uint8Array([value + 1]));
      console.log(`Sent value ${value} to characteristic ${charName}`);
    } catch (error) {
      console.error(`Error writing to characteristic ${charName}:`, error);
    }
  };

  const handleActionButtonClick = (actionValue) => {
    writeToCharacteristic('command', actionValue);
  };

  const handleGridActuatorClick = (actionValue) => {
    writeToCharacteristic('command', actionValue);
  };

  // Handles change in input fields for KPA

  const handleChange = (index, value) => {
    const numericValue = Number(value);
    if (numericValue > 255) {
      // Show an alert if the value exceeds 255
      alert('Value cannot exceed 255 KPA');
    } else {
      // Update the value normally if within the limit
      const updatedPressures = [...pressures];
      updatedPressures[index] = value; // Assuming you want to keep the input as a string
      setPressures(updatedPressures);
    }
  };

  // PART 2: CSS
  
  const dropdown = {
    marginBottom: '60px',
    marginLeft: '25px',
    fontSize: '40px',
  };
  const dropdowntext = {
    padding: '15px', // Adjust as needed to ensure the button is circular
    border: 'none',
    marginTop: '15px',
    marginBottom: '25px',
    display: 'inline-block',
    backgroundColor: 'grey',
    color: 'white',
    cursor: 'pointer',
    fontSize: '16px', // Adjust based on your preference
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: '1', // Ensures the text is centered if it wraps
  }
  const buttonStyleTwo = {
    margin: "2%",
    padding: '25px', // Adjust as needed to ensure the button is circular
    display: 'inline-block',
    color: 'white',
    fontSize: '20px',
    fontWeight: 'bold',
    borderRadius: '10px',
    color: 'white',
    backgroundColor: 'blue',
    borderColor: 'whitesmoke',
    padding: '20px',
    lineHeight: '1', // Ensures the text is centered if it wraps
  }

  return (
    <div  >
      <div>
        <h1 className="textStyle">A Knit Haptic Pneumatic Sleeve</h1>
        <h4 className="textStyle2">This GUI system supports the PortFlow8 developed by Ian Scholler. The HaptiKnit must be connected to the Arduino system via Bluetooth. The main functionality of this GUI is to support the testing of multiple actuators. To test other pneumatic systems, simply readjust the UI to better match the system configuration of your device. </h4>
        <div className="textStyle3"></div>
      </div>

      {/* Connect Bluetooth */}

      <button
        style={{ ...buttonStyleTwo, backgroundColor: isConnected ? 'gray' : 'blue' }} // Example style change based on connection status
        onClick={connectToDevice}
        disabled={!!isConnected}
      >
        {isConnected ? 'Connected' : 'Connect Bluetooth'}
      </button>

      {/* Disconnect Bluetooth */}
      <button
        style={{ ...buttonStyleTwo, backgroundColor: isConnected ? 'blue' : 'gray' }}
        onClick={disconnectToDevice}
        disabled={!isConnected}
        > Disconnect Bluetooth 
      </button>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>

      <h3 className='textStyle'>Select Number of Actuators: You have {actuatorNumbers} actuators selected. </h3>     
      {[1, 2, 3, 4, 5, 6, 7, 8].map(number => (
        <button key={number} className="dropdowntext" 
        onClick={() => handleActuatorNumberChange(number)} //Maybe not necessary.
        >
          {number}
        </button>
      ))}
      <button className="dropdowntext" onClick={() => resetButtons()}> RESET </button>
      </div>


      {/* Show Grey Grid*/}
      <h3 className="textStyle2">Drag and Drop Actuators into the Grid.</h3>
      <div className='basket'>
        {initialActuators
          .slice(0, actuatorNumbers) // Take only up to the number of actuators specified
          .filter(actuator => !placedActuators.find(a => a.id === actuator.id))
          .map(actuator => (
            <button
              key={actuator.id}
              draggable="true"
              onDragStart={(event) => handleDragStart(event, actuator)}
              onClick={() => handleActionButtonClick(actuator.id)}
              className="actuatorsButton"
            >
              {actuator.label}
            </button>
          ))}
      </div>

      <div style={{ display: 'flex', gap: '20px' }}>

      <div className="gridGrey">
        
      {/* {grid.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              onDrop={(event) => handleDrop(event, rowIndex, colIndex)}
              onDragOver={(event) => handleDragOver(event)}
              className="cell"
            >
              {cell ? <div className="actuatorsButton" key={cell} 
              onClick={() => handleActionButtonClick(cell)}>
              {cell.label}</div> : <p className="textStyle"> EMPTY </p>}
            </div>
          ))
        )}
 */}
        {grid.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              onDrop={(event) => handleDrop(event, rowIndex, colIndex)}
              onDragOver={(event) => handleDragOver(event)}
              className="cell"
            >
              {cell ? (
                <button
                  draggable="true"
                  onDragStart={(event) => handleDragStart(event, cell, 'grid', rowIndex, colIndex)}
                  onClick={() => handleActionButtonClick(cell.id)}
                  className="actuatorsButton"
                >
                  {cell.label}
                </button>
              ) : <p className="textStyle"> EMPTY </p>}
            </div>
          ))
        )}

        </div> 

        {/* Set Pressure */}
        <div className="pressureCell">
          <h2>Set Pressure:</h2>
          <form onSubmit={handleSubmit}>
            {Array.from({ length: actuatorNumbers }).map((_, index) => (
              <div key={index}>
                <label style={{display:'flex', gap: '20px', fontSize: '15px', padding: '5px'}}>
                  Actuator {index + 1}:
                  <input
                    className="inputStyle"
                    type="number"
                    value={pressures[index]}
                    onChange={(e) => handleChange(index, e.target.value)}
                    placeholder="Pressure value (kPa)"
                  />
                </label>
              </div>
            ))}
            <button type="submit" className='buttonStyleFour' onSubmit={() => handleSubmit()}>Submit</button>    
          </form>
        </div>
      </div>
      <img className='textStyle4' src={logo} alt="Logo" />
      <h4 className="textStyle4">Developed by Yannie Tan.</h4>

    </div>
  );
};

export default App;
