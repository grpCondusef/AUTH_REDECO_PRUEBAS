export const getTodayDate = () => {
    // Crear un nuevo objeto Date, que contendrá la fecha y la hora actuales
    let fechaActual = new Date();
  
    // Obtener el año, mes y día de la fecha actual
    let año = fechaActual.getFullYear();
    let mes = fechaActual.getMonth() + 1; // Los meses van de 0 a 11, por lo que sumamos 1
    let dia = fechaActual.getDate();
  
    // Formatear la fecha como una cadena en el formato deseado (por ejemplo, AAAA-MM-DD)
    let fechaFormateada =
      año + "-" + (mes < 10 ? "0" : "") + mes + "-" + (dia < 10 ? "0" : "") + dia;
  
    // Mostrar la fecha actual en la consola
    return fechaFormateada;
  };