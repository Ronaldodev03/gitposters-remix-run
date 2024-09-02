import { Form, useSubmit } from "@remix-run/react";
import { Input } from "./ui/input";
import { useState, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

//type
type PostSearchProps = {
  searchQuery: string | null;
  isSearching: boolean;
};

//component
export function PostSearch({ searchQuery, isSearching }: PostSearchProps) {
  const [query, setQuery] = useState(searchQuery || "");
  const submit = useSubmit();
  const timeoutRef = useRef<NodeJS.Timeout>(); //for tracking the timeout
  const formRef = useRef<HTMLFormElement>(null); //for submitting current of the form

  //no se para que es util este useEffect
  useEffect(() => {
    setQuery(query || "");
  }, [query]);

  //no se para que es util este useEffect
  useEffect(() => {
    // Only cleanup required for the timeout
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [timeoutRef]);

  const handleOnChangeForm = () => {
    //timeoutRef.curret es el ID del timeout, solo es undefine en la primera carga, si no es undefine entonces entra aqui y se limpia
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    //setTimeout retorna el ID del timeout, luego eso lo puedo meter en un clearTimeout para limpiar el timeout, lo guardo en una ref para que no cambie con los re-renders
    timeoutRef.current = setTimeout(() => {
      //sumit es para que se registre la form automaticamente (sin que sea el user que lo haga), eso agrega la key-value de la input a la URL
      submit(formRef.current);
    }, 300);
  };

  return (
    <div className="flex justify-between items-center my-3">
      <h2 className="md:text-xl font-heading font-semibold w-7/12">
        {query ? `Results for "${query}"` : "All posts"}
      </h2>
      <div className="w-1/12 flex justify-center">
        {isSearching && <Loader2 className="h-4 w-4 animate-spin" />}
      </div>
      <Form
        role="search"
        ref={formRef}
        id="search-form"
        className="w-4/12 flex"
        //al haber cambio en la input, hay un cambio en la Form y entra aqui
        onChange={handleOnChangeForm}
      >
        <Input
          type="search"
          name="query" //this name prop is important, w/o it the query won't be added
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
          placeholder="Search posts..."
        />
      </Form>
    </div>
  );
}
//conclusion: this form automatically appends query parameters to the URL because it uses the GET method,
//where form data is encoded into the URL as per the HTTP standard. The input's name and value become part of the URL,
//allowing the server to process them accordingly, typically used for filtering or search functionality in server-side handling.
