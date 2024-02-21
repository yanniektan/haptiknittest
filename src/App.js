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
  const [grid, setGrid] = useState(Array.from({ length: 6 }, () => Array(4).fill(null)));


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
    setActuatorNumbers(number);
    setPlacedActuators([]);
  };

  const handleDragStart = (event, actuator) => {
    console.log(event);
    event.dataTransfer.setData('text/plain', JSON.stringify(actuator));
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (event, rowIndex, colIndex) => {
    console.log(event);
    event.preventDefault();
    const actuator = JSON.parse(event.dataTransfer.getData('text'));

    if (!placedActuators.find(a => a.id === actuator.id)) {
      // Place the actuator
      setPlacedActuators(prev => [...prev, actuator]);

      // Update the grid with the dropped actuator
      const newGrid = [...grid];
      newGrid[rowIndex][colIndex] = actuator;
      setGrid(newGrid);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

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

  const writeToCharacteristic = async (charName, value) => {
    if (!characteristics[charName]) {
      console.log(`Characteristic ${charName} not found!`);
      return;
    }
    try {
      await characteristics[charName].writeValue(new Uint8Array([value]));
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
  
  const gridCell = {
    padding: '25px', // Adjust as needed to ensure the button is circular
    border: 'none',
    margin: '25px',
    width: '90px',
    height: '50px',
    borderRadius: '10%',
    backgroundColor: 'crimson',
    color: 'white',
    cursor: 'pointer',
    userSelect: 'none',
    fontSize: '20px', // Adjust based on your preference
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: '1',
  }
  const actuatorButton = {
    padding: '25px', // Adjust as needed to ensure the button is circular
    border: 'none',
    margin: '25px',
    width: '90px',
    height: '50px',
    borderRadius: '10%',
    backgroundColor: 'crimson',
    color: 'white',
    cursor: 'pointer',
    userSelect: 'none',
    fontSize: '20px', // Adjust based on your preference
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: '1',
  }
  const gridGrey = {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 190px)',
    gridGap: '70px',
    margin: '55px',
    color: 'white',
    fontWeight: 'bold',
    justifyContent: 'center',
    padding: '20px',
    border: '5px solid #ccc',
    borderRadius: '15px',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    backgroundColor: 'grey',
  };
  const textStyle = {
    height: '40px',
    color: 'black',
    margin: '25px',
  };
  const inputStyle = {
    marginLeft: '10px',
    marginBottom: '5px',
  }
  const imagelogo = {
    height: '100px',
    margin: '15px',
  };
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
  const buttonStyle = {
    margin: 25,
    padding: '15px', // Adjust as needed to ensure the button is circular
    border: 'none',
    display: 'inline-block',
    borderRadius: '50%',
    backgroundColor: 'crimson',
    color: 'white',
    cursor: 'pointer',
    userSelect: 'none',
    fontSize: '16px', // Adjust based on your preference
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: '1', // Ensures the text is centered if it wraps
  }
  const buttonStyleTwo = {
    margin: 25,
    padding: '15px', // Adjust as needed to ensure the button is circular
    display: 'inline-block',
    color: 'white',
    cursor: 'pointer',
    userSelect: 'none',
    fontSize: '16px', // Adjust based on your preference
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: '1', // Ensures the text is centered if it wraps
  }

  return (
    <div>
      <div>
        <h1 style={textStyle}>A Knit Haptic Pneumatic Sleeve</h1>
      </div>
      {/* <p style={textStyle}>Connected Device: {deviceName}</p> */}
      
      {/* Connect Bluetooth */}

      <button
        style={{ ...buttonStyleTwo, backgroundColor: isConnected ? 'gray' : 'blue' }} // Example style change based on connection status
        onClick={connectToDevice}
        disabled={!!isConnected}
      >
        {isConnected ? 'Connected' : 'Connect Bluetooth'}
      </button>

      {/* Disconnect Bluetooth
      <button
        style={{ ...buttonStyleTwo, backgroundColor: isConnected ? 'blue' : 'gray' }}
        onClick={disconnectToDevice}
        disabled={!isConnected}
        > Disconnect Bluetooth </button> */}

      <Dropdown style={dropdown}>
        <Dropdown.Toggle variant="success" id="dropdown-basic">
          Select Number of Actuators
        </Dropdown.Toggle>
        <Dropdown.Menu style={dropdown}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map(number => (
            <Dropdown.Item key={number} style={dropdowntext} onClick={() => handleActuatorNumberChange(number)}>
              {number}
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown> 

      <h3 style={textStyle}> You have {actuatorNumbers} actuators selected. </h3>      
        
      <div >
        {initialActuators
          .slice(0, actuatorNumbers) // Take only up to the number of actuators specified
          .filter(actuator => !placedActuators.find(a => a.id === actuator.id))
          .map(actuator => (
            <button
              key={actuator.id}
              draggable="true"
              onDragStart={(event) => handleDragStart(event, actuator)}
              onClick={() => handleActionButtonClick(actuator.id)}
              style={actuatorButton}
            >
              {actuator.label}
            </button>
          ))}
      </div>

      {/* Show Grey Grid*/}
      <div style={gridGrey}>
        {grid.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              onDrop={(event) => handleDrop(event, rowIndex, colIndex)}
              onDragOver={(event) => handleDragOver(event)}
              style={cell}
            >
              {cell ? <div style={actuatorButton}>
              {cell.label}</div> : <p> DROP HERE </p>}
            </div>
          ))
        )}
      </div> 

      {/* Set Pressure */}
      <div >
        <form onSubmit={handleSubmit}>
          {Array.from({ length: actuatorNumbers }).map((_, index) => (
            <div key={index}>
              <label style={textStyle}>
                Actuator {index + 1} - set pressure:
                <input
                  style={inputStyle}
                  type="number"
                  value={pressures[index]}
                  onChange={(e) => handleChange(index, e.target.value)}
                  placeholder="Pressure value"
                /> kPa
              </label>
            </div>
          ))}
          <button type="submit">Submit</button>    
        </form>
      </div>

      <img style={imagelogo} src={logo} alt="Logo" />;

    </div>
  );
};

export default App;
